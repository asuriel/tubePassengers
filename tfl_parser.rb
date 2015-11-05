require "csv"
require "json"

class TubeLines

	@tube_lines

	def initialize()
		@tube_lines = Hash.new 
	end


	def get_passenger_data(url, output)
		target = File.open(output, 'w')
		stations = []
		CSV.foreach(url,:headers=> true) do |row|
			if row[0] != nil 
				station = row[0].strip 

				if @tube_lines.include?(station)
					station_line_indices = station_line_index(station)
					puts station_line_indices 
			

					times_array = []

					for i in 1..row.length do
						times_array << [mins_since_midnight(row.headers[i]),row[i].to_i]
					end

					times = {:times=> times_array}

					stations.push(station_line_indices.merge(times))
				end
				
			end
		end
		target.write(stations.to_json)
		target.close()

	end

	def mins_since_midnight(time_string)
		if time_string != nil
			start_hour = time_string.split("-")[0].split("")
			(time_string[0].concat(time_string[1]).to_i )* 60 + time_string[2].concat(time_string[3]).to_i
		end

	end

	def extract_stations_by_line!()
		station_counter = 0	
		line_counter = 0

		target = File.open("victoria_stations_position_px.txt", 'r')
		lines = target.readlines

		tube_line_name = lines[0].split(":")[1].chomp.strip
		lines.delete_at(0)

		lines.each do |row|
			if row.include?("Line") == true && row.empty? == false
				tube_line_name = row.split(":")[1].chomp.strip
				station_counter = 0	
				line_counter = line_counter + 1
			else
				if row.split(",").length == 3
					station_counter = station_counter + 1
			
					station_name, station_x, station_y = row.split(",")
					
					station = {station_name => [tube_line_name,station_x.strip.to_i,station_y.strip.to_i] }
					@tube_lines.merge!(station)
				end
				
			end
		end
	end

	def station_line_index(station)
		data = {:name => station}
		line = {:line => @tube_lines[station][0]}
		station_x = {:station_x => @tube_lines[station][1]}
		station_y  = {:station_y => @tube_lines[station][2]}

		data.merge!(line).merge!(station_x).merge!(station_y)
		data

	end

	def disambiguateSharedStation(station,index,line)
		name = station.split("(")[0]
		line = station.split("(")[1].chomp(")")

	end


	def getLines 
		@tube_lines
	end

	def isInLine?(station, line)
		@tube_lines[line].include?(station)
	end


	

	reader = TubeLines.new
	reader.extract_stations_by_line!()
	# puts reader.getLines["Bermondsey"]
	reader.get_passenger_data("passenger_data_longer.csv", "ready_data.json")
	



end
