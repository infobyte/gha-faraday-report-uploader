#!/usr/bin/env bash

faraday::authenticate() {
  echo "Authenticating in Faraday"

  local FARADAY_HOST=$1
  local FARADAY_USERNAME=$2
  local FARADAY_PASSWORD=$3

  faraday-cli auth --url $FARADAY_HOST --user $FARADAY_USERNAME --password $FARADAY_PASSWORD
}

faraday::create_workspace() {
  local FARADAY_WORKSPACE=$1

  echo "Creating workspace $FARADAY_WORKSPACE if it doesn't exists"
  faraday-cli workspace -a create -n $FARADAY_WORKSPACE > /dev/null
  echo "Workspace $FARADAY_WORKSPACE created/selected successfully"
}

faraday::upload_report() {
  local FARADAY_WORKSPACE=$1
  local FARADAY_REPORT_FILENAME=$2

  echo "Uploading report to $FARADAY_WORKSPACE"
  faraday-cli report -ws $FARADAY_WORKSPACE $FARADAY_REPORT_FILENAME

  echo "Faraday import finished successfully"
}