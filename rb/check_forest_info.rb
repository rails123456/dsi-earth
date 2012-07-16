#!/usr/bin/ruby

require 'cgi'
require 'rubygems'
require 'pg'

def log(msg)
  log = open("/tmp/dsi-cloud.log","a")
  log.write(msg)
  log.write("\n")
  log.close
end

def check_npark(lon,lat)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select name_th from national_park where contains(the_geom,"
  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  name = "NA"
  if (found == 1)
    res.each do |rec|
      name = '<b><bi>เขตอุทยาน' << rec['name_th'] << '</i></b>'
    end
  end
  name
end

def check_rforest(lon,lat)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select name_th,mapsheet,area_decla,dec_date,ratchakija,ton "
  sql += "from reserve_forest "
  sql += "where contains(the_geom,"
  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
  log("check_rforest-sql: #{sql}")
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  msg = "NA"
  if (found == 1)
    res.each do |rec|
      name = rec['name_th']
      mapsheet = rec['mapsheet']
      area_decla = rec['area_decla']
      dec_date = rec['dec_date']
      ratchakija = rec['ratchakija']
      ton = rec['ton']
      msg = "<font face=\"time, serif\" size=\"4\"><b><i>เขตป่าสงวน#{name}</i></b><br />ระวาง:#{mapsheet}<br/>"
      msg += "พื้นที่:#{area_decla} ตร.ม.<br />ประกาศเมื่อ: #{dec_date}<br />"
      msg += "ราชกิจจานุเบกษา: #{ratchakija} ตอนที่: #{ton}</font>"
      end
  end
  #log("check_rforest-msg: #{msg}")
  msg 
end

c = CGI::new
layer = c['layer']
lon = c['lon'].to_f
lat = c['lat'].to_f

msg = nil

if layer == 'national_park'
  msg = check_npark(lon,lat)
elsif layer == 'reserve_forest'
  msg = check_rforest(lon,lat)
end

data = "{'msg':'#{msg}','lon':'#{lon}','lat':'#{lat}'}"

print <<EOF
Content-type: text/html

#{data}
EOF
