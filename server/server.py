from flask import Flask
from flask import request
from flask import jsonify
from flask_cors import CORS
from waitress import serve
import json
import os
import pathlib
import re
import sys

from lib.DataSource import DataSource
import lib.regexp_pattern as RegexPattern

ROOT = os.path.dirname(os.path.abspath(__file__))
with open(ROOT + '/conf.json') as f:
  conf = json.load(f)

dataSource = DataSource(conf)

def readSarFile(sarFile):
  dataSource.readCPUFromSaFile(sarFile)
  dataSource.readMemFromSaFile(sarFile)
  dataSource.readIOFromSaFile(sarFile)

def readSarFileBz2(sarFile):
  dataSource.readCPUFromSaFileBz2(sarFile)
  dataSource.readMemFromSaFileBz2(sarFile)
  dataSource.readIOFromSaFileBz2(sarFile)

def readAllSarFile():
  sarDir = pathlib.Path(conf['sar_dir'])
  sarFiles = list(sarDir.glob('**/sar*'))

  for sarFile in sarFiles:
    if sarFile.is_file():
      if sarFile.suffix == '':
        readSarFile(sarFile)
      elif sarFile.suffix == '.bz2':
        readSarFileBz2(sarFile)

def updateTrend():
  dataSource.buildCPUTrendData()
  dataSource.buildMemTrendData()
  dataSource.buildIOTrendData()

app = Flask(__name__, static_folder='./build', static_url_path='/')
CORS(
  app,
  supports_credentials=True
)

#@app.route("/")
#def hello():
#  return "Hello World"

@app.route("/hostlist")
def host_list_get():
  return jsonify(dataSource.getHostList())

@app.route("/iodevicelist:<host>")
def device_list_get(host):
  return jsonify(dataSource.getIODeviceList(host))

@app.route("/cpu_util/<datatype>")
def cpu_util_get(datatype):
  host = request.args.get('host')
  start = request.args.get('start')
  end = request.args.get('end')

  if start is None or end is None or host is None:
    return jsonify({"rc": 255})

  if datatype == 'history':
    responseData = dataSource.getCPUHistoryDataColumnar(host, start, end)
    return jsonify({"rc": 0, "result": responseData})

  elif datatype == 'trend':
    responseData = dataSource.getCPUTrendDataColumnar(host, start, end)
    return jsonify({"rc": 0, "result": responseData})

  else:
    return jsonify({"rc": 1}) 
  
@app.route("/mem_use/<datatype>")
def mem_use_get(datatype):
  host = request.args.get('host')
  start = request.args.get('start')
  end = request.args.get('end')

  if start is None or end is None or host is None:
    return jsonify({"rc": 255})

  if datatype == 'history':
    responseData = dataSource.getMEMHistoryDataColumnar(host, start, end)
    return jsonify({"rc": 0, "result": responseData})

  elif datatype == 'trend':
    responseData = dataSource.getMEMTrendDataColumnar(host, start, end)
    return jsonify({"rc": 0, "result": responseData})

  else:
    return jsonify({"rc": 1}) 
 
@app.route("/io/<datatype>")
def io_get(datatype):
  host = request.args.get('host')
  device = request.args.get('device')
  start = request.args.get('start')
  end = request.args.get('end')

  if start is None or device is None or end is None or host is None:
    return jsonify({"rc": 255})

  if datatype == 'history':
    responseData = dataSource.getIOHistoryDataColumnar(host, device, start, end)
    return jsonify({"rc": 0, "result": responseData})

  elif datatype == 'trend':
    responseData = dataSource.getIOTrendDataColumnar(host, device, start, end)
    return jsonify({"rc": 0, "result": responseData})

  else:
    return jsonify({"rc": 1}) 
 
if __name__ == "__main__":
  print(app.url_map)
  if len(sys.argv) > 1 and sys.argv[1] == '-update':
    readAllSarFile()
    updateTrend()

  print('Server start: {0}:{1}'.format(conf['server'], conf['port']))
  serve(app, host=conf['server'], port=conf['port'])
