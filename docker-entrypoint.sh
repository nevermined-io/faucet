#!/bin/bash

RETRY_COUNT=0
COMMAND_STATUS=1


printf '\n\e[33m◯ Waiting for Elasticsearch to start...\e[0m\n'

echo $CURL_CMD
until [ $COMMAND_STATUS -eq 0 ] || [ $RETRY_COUNT -eq 120 ]; do
  curl -w httpcode=%{http_code} -m 100 $DB_URI
  COMMAND_STATUS=$?
  if [ $COMMAND_STATUS -eq 0 ]; then
    printf '\n\e[32m✔ ElasticSearch connection success.\e[0m\n'
    break
  fi
  sleep 5
  let RETRY_COUNT=RETRY_COUNT+1
done

if [ $COMMAND_STATUS -ne 0 ]; then
  echo "Waited for more than ten minutes, but Elasticserach didn't start yet."
  exit 1
fi

sh ./scripts/wait-nevermined.sh

npm run serve
tail -f /dev/null
