FROM python:3.8

ADD entrypoint.sh /entrypoint.sh
ADD src /src

RUN pip install faraday-cli

ENTRYPOINT ["/entrypoint.sh"]