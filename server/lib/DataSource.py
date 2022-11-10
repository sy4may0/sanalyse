import sqlite3
import time
import bz2
import re
from decimal import Decimal
from decimal import ROUND_HALF_UP
from datetime import datetime
from datetime import timedelta

import lib.sql_query as sql_query
import lib.regexp_pattern as regex_pattern

def timeString2UnixTime(str):
  dt = datetime.strptime(str, '%Y-%m-%dT%H:%M:%S')
  return dt.timestamp()

def unixTime2StringTime(unixTime):
  dt = datetime.fromtimestamp(unixTime)
  return dt.strftime('%Y-%m-%dT%H:%M:%S')

class DataSource:

  def __init__(self, conf):
    self.dbname = conf['sqlite3db']
    self.conf = conf
    conn = sqlite3.connect(self.dbname)
    cursor = conn.cursor()

    cursor.execute(sql_query.CREATE_TB_HISTORY_CPU_UTIL)
    cursor.execute(sql_query.CREATE_TB_HISTORY_MEM_USE)
    cursor.execute(sql_query.CREATE_TB_HISTORY_IO)
    cursor.execute(sql_query.CREATE_TB_TREND_CPU_UTIL)
    cursor.execute(sql_query.CREATE_TB_TREND_MEM_USE)
    cursor.execute(sql_query.CREATE_TB_TREND_IO)

  def fixCpuDataStack(self, cpuData):
    val = 0
    result = [0,0,0,0,0,0,0,0,0]
    for i in range(9):
      val += float(cpuData[i])
      result[i] += val

    return result

  def fixMemDataStack(self, memData):
    val = 0

    memData[1] = int(memData[1]) - (int(memData[2]) + int(memData[3]))
    result = [0,0,0,0,0]
    val += int(memData[1])
    result[1] += val
    val += int(memData[2])
    result[2] += val
    val += int(memData[3])
    result[3] += val
    val += int(memData[0])
    result[0] += val
    result[4] = int(memData[4])

    return result

  def readCPULine(self, lines, date, host, conn): 
    for line in lines:
      if('proc/s' in line): 
        print('CPU read success.')
        break
  
      cpuUtilSet = line.split()
      if len(cpuUtilSet) > 0 and cpuUtilSet[1] == 'all':
        try:
          parsedTime = time.strptime(cpuUtilSet[0], self.conf['sar_time_pattern'])
        except ValueError:
          continue

        sqlPayload = [
          timeString2UnixTime(date + 'T' + time.strftime('%H:%M:%S', parsedTime)),
          host,
        ]
        #TODO gniceを消す処理。後でconfでパーサー指定できるようにする。
        cpuUtilSet.pop(10)
        cpuData = self.fixCpuDataStack(cpuUtilSet[2:11])
        sqlPayload.extend(cpuData)
  
        cursor = conn.cursor()
        cursor.execute(sql_query.INSERT_TB_HISTORY_CPU_UTIL, sqlPayload)

    conn.commit()
  
  def readCPUFromSaFile(self, path):
    with open(path, 'r') as f:
      lines = f.readlines() 

    if not re.match(regex_pattern.SAR_HEAD_PATTERN, lines[0]):
      print('LOAD_CPU_DATA_FAILED: ' + str(path))
      return 


    date = lines[0].split()[3]
    host = lines[0].split()[2].lstrip('(').rstrip(')')

    print('LOAD_CPU_DATA: {0} - {1} from {2}'.format(host, date, path))

    with sqlite3.connect(self.dbname) as conn:
      self.readCPULine(lines,date,host,conn)

  def readCPUFromSaFileBz2(self, path):
    with bz2.open(path, 'rb') as f:
      sarFileByte = f.read()
      lines = sarFileByte.decode().split('\n')

    if not re.match(regex_pattern.SAR_HEAD_PATTERN, lines[0]):
      print('LOAD_BZ2_CPU_DATA_FAILED: ' + str(path))
      return 
   
    date = lines[0].split()[3]
    host = lines[0].split()[2].lstrip('(').rstrip(')')

    print('LOAD_BZ2_CPU_DATA: {0} - {1} from {2}'.format(host, date, path))

    with sqlite3.connect(self.dbname) as conn:
      self.readCPULine(lines,date,host,conn)
 
  def readMemLine(self, lines, date, host, conn):
    readFlag = False
    for line in lines:
      if "kbmemfree" in line:
        readFlag = True

      if "kbswpfree" in line:
        print('Memory read success.')
        break

      if not readFlag:
        continue
      
      memUseSet = line.split()
      if len(memUseSet) > 0 and memUseSet[1] != 'kbmemfree':
        try:
          parsedTime = time.strptime(memUseSet[0], self.conf['sar_time_pattern'])
        except ValueError:
          continue
        sqlPayload = [
          timeString2UnixTime(date + 'T' + time.strftime('%H:%M:%S', parsedTime)),
          host,
        ]

        md = []
        md.extend(memUseSet[1:3])
        md.extend(memUseSet[4:7])
        memData = self.fixMemDataStack(md)
        sqlPayload.extend(memData)

        cursor = conn.cursor()
        cursor.execute(sql_query.INSERT_TB_HISTORY_MEM_USE, sqlPayload)
    conn.commit()
 
  def readMemFromSaFile(self, path):
    with open(path, 'r') as f:
      lines = f.readlines() 

    if not re.match(regex_pattern.SAR_HEAD_PATTERN, lines[0]):
      print('LOAD_MEMORY_DATA_FAILED: ' + str(path))
      return 

    date = lines[0].split()[3]
    host = lines[0].split()[2].lstrip('(').rstrip(')')

    print('LOAD_MEMORY_DATA: {0} - {1} from {2}'.format(host, date, path))

    with sqlite3.connect(self.dbname) as conn:
      self.readMemLine(lines, date, host, conn)

  def readMemFromSaFileBz2(self, path):
    with bz2.open(path, 'rb') as f:
      sarFileByte = f.read()
      lines = sarFileByte.decode().split('\n')

    if not re.match(regex_pattern.SAR_HEAD_PATTERN, lines[0]):
      print('LOAD_BZ2_MEMORY_DATA_FAILED: ' + str(path))
      return 

    date = lines[0].split()[3]
    host = lines[0].split()[2].lstrip('(').rstrip(')')

    print('LOAD_BZ2_MEMORY_DATA: {0} - {1} from {2}'.format(host, date, path))

    with sqlite3.connect(self.dbname) as conn:
      self.readMemLine(lines, date, host, conn)

  def readIOLine(self, lines, date, host, conn):
    readFlag = False
    for line in lines:
      if "rd_sec/s" in line:
        readFlag = True

      if "rxpck/s" in line:
        print('IO read success.')
        break

      if not readFlag:
        continue
      
      ioSet = line.split()

      if len(ioSet) > 0 and ioSet[1] != 'DEV':
        try:
          parsedTime = time.strptime(ioSet[0], self.conf['sar_time_pattern'])
        except ValueError:
          continue
        sqlPayload = [
          timeString2UnixTime(date + 'T' + time.strftime('%H:%M:%S', parsedTime)),
          host,
        ]

        sqlPayload.append(ioSet[1])
        sqlPayload.append(ioSet[3])
        sqlPayload.append(ioSet[4])

        cursor = conn.cursor()
        cursor.execute(sql_query.INSERT_TB_HISTORY_IO, sqlPayload)
    conn.commit()

  def readIOFromSaFile(self, path):
    with open(path, 'r') as f:
      lines = f.readlines() 

    if not re.match(regex_pattern.SAR_HEAD_PATTERN, lines[0]):
      print('LOAD_IO_DATA_FAILED: ' + str(path))
      return 

    date = lines[0].split()[3]
    host = lines[0].split()[2].lstrip('(').rstrip(')')

    print('LOAD_IO_DATA: {0} - {1} from {2}'.format(host, date, path))

    with sqlite3.connect(self.dbname) as conn:
      self.readIOLine(lines, date, host, conn)

  def readIOFromSaFileBz2(self,path):
    with bz2.open(path, 'rb') as f:
      sarFileByte = f.read()
      lines = sarFileByte.decode().split('\n')

    if not re.match(regex_pattern.SAR_HEAD_PATTERN, lines[0]):
      print('LOAD_BZ2_IO_DATA_FAILED: ' + str(path))
      return 

    date = lines[0].split()[3]
    host = lines[0].split()[2].lstrip('(').rstrip(')')

    print('LOAD_BZ2_IO_DATA: {0} - {1} from {2}'.format(host, date, path))

    with sqlite3.connect(self.dbname) as conn:
      self.readIOLine(lines, date, host, conn)

  def getCPUDataColumnar(self, host, startStr, endStr, query):
    startTimeStamp = timeString2UnixTime(startStr)
    endTimeStamp = timeString2UnixTime(endStr)

    historyData = {
      "datetime": list(),
      "usr": list(),
      "nice": list(),
      "sys": list(),
      "iowait": list(),
      "steal": list(),
      "irq": list(),
      "soft": list(),
      "guest": list(),
      "idle": list()
    }
 
    with sqlite3.connect(self.dbname) as conn:
      cursor = conn.cursor()
      cursor.execute(query, [host, startTimeStamp, endTimeStamp])
      for row in cursor:
         historyData['datetime'].append(row[0])
         historyData['usr'].append(row[2])
         historyData['nice'].append(row[3])
         historyData['sys'].append(row[4])
         historyData['iowait'].append(row[5])
         historyData['steal'].append(row[6])
         historyData['irq'].append(row[7])
         historyData['soft'].append(row[8])
         historyData['guest'].append(row[9])
         historyData['idle'].append(row[10])
  
    return historyData

  def getMEMDataColumnar(self, host, startStr, endStr, query):
    startTimeStamp = timeString2UnixTime(startStr)
    endTimeStamp = timeString2UnixTime(endStr)

    historyData = {
      "datetime": list(),
      "kbmemfree": list(),
      "kbmemused": list(),
      "kbbuffers": list(),
      "kbcached": list(),
      "kbcommit": list(),
    }
   
    with sqlite3.connect(self.dbname) as conn:
      cursor = conn.cursor()
      cursor.execute(query, [host, startTimeStamp, endTimeStamp])
      for row in cursor:
        historyData['datetime'].append(row[0])
        historyData['kbmemfree'].append(row[2])
        historyData['kbmemused'].append(row[3])
        historyData['kbbuffers'].append(row[4])
        historyData['kbcached'].append(row[5])
        historyData['kbcommit'].append(row[6])
  
    return historyData

  def getIODataColumnar(self, host, device, startStr, endStr, query):
    startTimeStamp = timeString2UnixTime(startStr)
    endTimeStamp = timeString2UnixTime(endStr)

    historyData = {
      "datetime": list(),
      "readsec": list(),
      "writesec": list(),
    }
   
    with sqlite3.connect(self.dbname) as conn:
      cursor = conn.cursor()
      cursor.execute(query, [host, device, startTimeStamp, endTimeStamp])
      for row in cursor:
        historyData['datetime'].append(row[0])
        historyData['readsec'].append(row[3])
        historyData['writesec'].append(row[4])
  
    return historyData

  def buildCPUTrendData(self):
    hosts = self.getHostList()
    with sqlite3.connect(self.dbname) as conn:
      cursor = conn.cursor()
      for host in hosts:
        counter = 0
        cursor.execute(sql_query.GET_DATETIME_CPU_HISTORY_START, [host])
        for row in cursor:
          starttime = int(row[0])
        cursor.execute(sql_query.GET_DATETIME_CPU_HISTORY_END, [host])
        for row in cursor:
          endtime = int(row[0])

        while starttime < endtime:
          sqlPayload = [
            starttime,
            host,
            0, 0, 0, 0, 0, 0, 0, 0, 0
          ]
          cursor.execute(
            sql_query.SELECT_HISTORY_CPU_UTIL_TIMEBLOCK, 
            [host, starttime, (starttime + self.conf['trend_div'])])
          
          for row in cursor:
            for i in range(9):
              if sqlPayload[i+2] < row[i+2]:
                sqlPayload[i+2] = row[i+2]

          cursor.execute(sql_query.INSERT_TB_TREND_CPU_UTIL, sqlPayload)
          counter += 1
          starttime+=self.conf['trend_div']
        
        conn.commit() 
        print(host + ' CPU trend data built: ' + str(counter) + 'entries.')

  def buildMemTrendData(self):
    hosts = self.getHostList()
    with sqlite3.connect(self.dbname) as conn:
      cursor = conn.cursor()
      for host in hosts:
        counter = 0
        cursor.execute(sql_query.GET_DATETIME_MEM_HISTORY_START, [host])
        for row in cursor:
          starttime = int(row[0])
        cursor.execute(sql_query.GET_DATETIME_MEM_HISTORY_END, [host])
        for row in cursor:
          endtime = int(row[0])

        while starttime < endtime:
          sqlPayload = [
            starttime,
            host,
            0, 0, 0, 0, 0
          ]
          cursor.execute(
            sql_query.SELECT_HISTORY_MEM_USE_TIMEBLOCK, 
            [host, starttime, (starttime + self.conf['trend_div'])])
          
          for row in cursor:
            for i in range(5):
              if sqlPayload[i+2] < row[i+2]:
                sqlPayload[i+2] = row[i+2]

          cursor.execute(sql_query.INSERT_TB_TREND_MEM_USE, sqlPayload)
          counter += 1
          starttime+=self.conf['trend_div']

        conn.commit() 
        print(host + ' Memory trend data built: ' + str(counter) + 'entries.')

  def buildIOTrendData(self):
    hosts = self.getHostList()
    with sqlite3.connect(self.dbname) as conn:
      cursor = conn.cursor()
      for host in hosts:
        counter = 0
        devices = self.getIODeviceList(host)
        for device in devices:
          cursor.execute(sql_query.GET_DATETIME_IO_HISTORY_START, [host, device])
          for row in cursor:
            starttime = int(row[0])
          cursor.execute(sql_query.GET_DATETIME_IO_HISTORY_END, [host, device])
          for row in cursor:
            endtime = int(row[0])

          while starttime < endtime:
            sqlPayload = [
              starttime,
              host,
              device,
              0.0, 0.0
            ]
            cursor.execute(
              sql_query.SELECT_HISTORY_IO_TIMEBLOCK, 
              [host, device, starttime, (starttime + self.conf['trend_div'])])
            
            for row in cursor:
              for i in range(2):
                if sqlPayload[i+3] < row[i+3]:
                  sqlPayload[i+3] = row[i+3]
  
            cursor.execute(sql_query.INSERT_TB_TREND_IO, sqlPayload)
            counter += 1
            starttime+=self.conf['trend_div']

        conn.commit()
        print(host + ' IO trend data built: ' + str(counter) + 'entries.')
         
          
  def getCPUHistoryDataColumnar(self, host, startStr, endStr):
    return self.getCPUDataColumnar(host, startStr, endStr, sql_query.SELECT_HISTORY_CPU_UTIL_TIMEBLOCK)

  def getCPUTrendDataColumnar(self, host, startStr, endStr):
    return self.getCPUDataColumnar(host, startStr, endStr, sql_query.SELECT_TREND_CPU_UTIL_TIMEBLOCK)

  def getMEMHistoryDataColumnar(self, host, startStr, endStr):
    return self.getMEMDataColumnar(host, startStr, endStr, sql_query.SELECT_HISTORY_MEM_USE_TIMEBLOCK)

  def getMEMTrendDataColumnar(self, host, startStr, endStr):
    return self.getMEMDataColumnar(host, startStr, endStr, sql_query.SELECT_TREND_MEM_USE_TIMEBLOCK)
  
  def getIOHistoryDataColumnar(self, host, device, startStr, endStr):
    return self.getIODataColumnar(host, device, startStr, endStr, sql_query.SELECT_HISTORY_IO_TIMEBLOCK)

  def getIOTrendDataColumnar(self, host, device, startStr, endStr):
    return self.getIODataColumnar(host, device, startStr, endStr, sql_query.SELECT_TREND_IO_TIMEBLOCK)

  def getHostList(self):
    hostlist = list()
    with sqlite3.connect(self.dbname) as conn:
      cursor = conn.cursor()
      cursor.execute(sql_query.SELECT_HOST_LIST)
      for row in cursor:
        hostlist.append(row[0])
      
    return hostlist

  def getIODeviceList(self, host):
    devicelist = list()
    with sqlite3.connect(self.dbname) as conn:
      cursor = conn.cursor()
      cursor.execute(sql_query.SELECT_IO_DEVICE_LIST, [host])
      for row in cursor:
        devicelist.append(row[0])

    return devicelist