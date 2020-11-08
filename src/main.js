const core = require('@actions/core');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data')

const HOST = 'host';
const USERNAME = 'username';
const PASSWORD = 'password';
const WORKSPACE = 'workspace';
const FILES = 'files';

/**
 *
 * @param {Object} opts
 * @param {Object} opts.agent
 * @param {String} opts.baseUrl
 * @param {String} opts.username
 * @param {String} opts.password
 * @return {Promise<*>}
 */
async function login (opts) {
    const {agent, username, password} = opts;

    core.debug('Login to Faraday');

    const url = `/_api/login`;
    const credentials = { email: username, password }

    const response = await agent.post(url, credentials);

    agent.defaults.headers.Cookie = response.headers['set-cookie']

    return response
}

/**
 *
 * @param {Object} opts
 * @param {Object} opts.agent
 * @param {String} opts.workspace
 * @return {Promise<Boolean>}
 */
async function existsWorkspace (opts) {
    const {agent, workspace} = opts;

    core.debug(`Checking if workspace ${workspace} already exists`);

    const url = `/_api/v2/ws`;

    const response = await agent.get(url);

    return response.data.some(ws => ws.name === workspace)
}

/**
 *
 * @param {Object} opts
 * @param {Object} opts.agent
 * @param {String} opts.username
 * @param {String} opts.workspace
 * @return {Promise<*>}
 */
async function createWorkspace (opts) {
    const {agent, username, workspace} = opts;

    core.debug(`Workspace ${workspace} doesn't existes. Creating it`);

    const url = `/_api/v2/ws`;
    const data = {
        _id: workspace,
        name: workspace,
        type: 'Workspace',
        users: [username]
    }

    return agent.post(url, data);
}

/**
 *
 * @param {Object} opts
 * @param {Object} opts.agent
 * @param {String} opts.filename
 * @param {String} opts.workspace
 * @return {Promise<*>}
 */
async function uploadFile (opts) {
    const {agent, filename, workspace} = opts;

    core.debug(`Uploading report ${filename} in workspace ${workspace}`);

    const csrfUrl = `/_api/session`;
    const url = `/_api/v2/ws/${workspace}/upload_report`;

    const csrfResponse = await agent.get(csrfUrl);
    const csrfToken = csrfResponse.data.csrf_token;
    const file = await fs.promises.readFile(filename)

    const files = new FormData();
    files.append('csrf_token', csrfToken);
    files.append('file', file, { filename });

    return agent.post(url, files, {headers: {...files.getHeaders(), 'Content-Length': files.getLengthSync()}});
}


/**
 *
 * @param {Object} opts
 * @param {String} opts.baseUrl
 * @param {String} opts.username
 * @param {String} opts.password
 * @param {String} opts.workspace
 * @param {String} opts.files
 */
async function uploadReport(opts) {
    const {baseUrl, username, password, workspace, files} = opts;

    core.debug(`Importing scan from ${filename}`);

    // ATTENTION: We need to keep the session, so we are going to create an axios instance using
    // the param withCredentials that allows to keep the cookies and avoid us to pass them through
    // every request manually
    const agent = axios.create({ baseURL: baseUrl, withCredentials: true});

    await login({agent, baseUrl, username, password});
    const wsExists = await existsWorkspace({agent, workspace});

    if (wsExists === false) {
        await createWorkspace({agent, username, workspace})
    }

    const promises = [];
    for (const file of files) {
        promises.push(
            uploadFile({agent, workspace, filename: file})
        );
    }
    await Promise.all(promises);

    core.debug(`Report uploaded successfully`)
}

async function main() {
    try {
        core.startGroup('Uploading Report to Faraday');
        const host = core.getInput(HOST);
        const username = core.getInput(USERNAME);
        const password = core.getInput(PASSWORD);
        const workspace = core.getInput(WORKSPACE);
        const files = core.getInput(FILES);

        await uploadReport({
            baseUrl: host,
            username,
            password,
            workspace,
            files
        })
    } catch (error) {
        core.setFailed(error.message);
    } finally {
        core.endGroup();
    }
}

main()

