from lib.DataSource import DataSource
import pprint
import json

with open('conf.json', 'r') as f:
  conf = json.load(f)

dataSource = DataSource('./sanalyse.db')
dataSource.readCPUFromSaFile('./sar_file/sar202210/scvap12/sar09', conf)


pprint.pprint(dataSource.getCPUHistoryDataColumnar("innwsrv2A.tacc.jaxa.jp", "2020-07-19T00:00:00", "2020-07-19T02:00:00"))
pprint.pprint(dataSource.getCPUTrendDataColumnar("innwsrv2A.tacc.jaxa.jp", "2020-07-19T00:00:00", "2020-07-19T02:00:00"))