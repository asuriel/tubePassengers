require "csv"
require "json"

class TubeLines

	@tube_lines

	def initialize()
		@tube_lines = Hash.new 
	end


	def get_data(url, output)
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

		target = File.open("victoria_stations.txt", 'r')
		lines = target.readlines

		tube_line_name = lines[0].split(":")[1].chomp.strip
		lines.delete_at(0)

		lines.each do |row|
			if row.include?("Line") == true && row.empty? == false
				tube_line_name = row.split(":")[1].chomp.strip
				station_counter = 0	
				line_counter = line_counter + 1
			else

				station_counter = station_counter + 1
				station = {row.chomp => [tube_line_name,line_counter,station_counter] }
				@tube_lines.merge!(station)
				
			end
		end
	end

	def station_line_index(station)
		data = {:name=> station}
		line = {:line => @tube_lines[station][0]}
		line_index = {:line_index => @tube_lines[station][1]}
		station_index = {:station_index => @tube_lines[station][2]}

		data.merge!(line).merge!(line_index).merge!(station_index)
		data

	end

	def disambiguateSharedStation(station,index,line)
		name = station.split("(")[0]
		line = station.split("(")[1].chomp(")")

	end


	# 		if (row.include?("Line") == true && !line_stations.empty? )
	# 			stations = {tube_line_name => line_stations}
	# 			# puts stations
	# 			@tube_lines.merge!(stations)
	# 			tube_line_name = row.split(":")[1].chomp.strip
	# 			# puts tube_line_name
	# 			line_stations = []
	# 		else
	# 			line_stations.push(row.chomp)
	# 		end
	# 	end
		 
	# end

	def getLines 
		@tube_lines
	end

	def isInLine?(station, line)
		@tube_lines[line].include?(station)
	end


	

	reader = TubeLines.new
	reader.extract_stations_by_line!()
	# puts reader.getLines["Bermondsey"]
	reader.get_data("passenger_data_longer.csv", "ready_data.json")
	



end