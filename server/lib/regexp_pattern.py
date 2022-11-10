import re

SAR_CPU_UTIL_PATTERN = re.compile(r'^[0-9]{2}.+[0-9]{2}.+[0-9]{2}.*\s+all(\s+[0-9]+\.[0-9]+){9}')
SAR_MEM_USE_PATTERN  = re.compile(r'^[0-9]{2}.+[0-9]{2}.+[0-9]{2}.*(\s+[0-9]+){2}\s+[0-9]+\.[0-9]+(\s+[0-9]+){3}\s+[0-9]+\.[0-9]+')
SAR_HEAD_PATTERN = re.compile(r'Linux\s+.+\s+\(.+\)\s+[0-9]{4}-[0-9]{2}-[0-9]{2}\s+.+\s+.+')