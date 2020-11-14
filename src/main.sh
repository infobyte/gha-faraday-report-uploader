#!/usr/bin/env bash

# shellcheck disable=SC1090
source "$PROJECT_HOME/src/ensure.sh"
source "$PROJECT_HOME/src/github.sh"
source "$PROJECT_HOME/src/misc.sh"
source "$PROJECT_HOME/src/faraday.sh"

main() {
  log::message "Running the process..."

  # Ensure environemnt is ok
  ensure::faraday_cli_command_exists
  ensure::minimun_args 5 "$@"

  # Map required variables
  export HOST="$1"
  export USERNAME="$2"
  export PASSWORD="$3"
  export WORKSPACE="$4"

  #Authenticate and create working workspace in Faraday
  faraday::authenticate "$HOST" "$USERNAME" "$PASSWORD"
  faraday::create_workspace "$WORKSPACE"

  for FILE in "${@:5:$#}"
  do
    faraday::upload_report "$WORKSPACE" "$FILE"
  done
}