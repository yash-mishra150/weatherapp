import { Link } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, Image, ImageBackground, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import backgroundImg from '../../assets/backgroundImg.png';
import AntDesign from '@expo/vector-icons/AntDesign';
import { fetchLocation, fetchWeatherForecast } from "@/lib/Weather";
import { debounce } from "lodash";
import { getData, storeData } from "@/lib/AsyncStorage";
import { iconsImages } from "@/lib/constants";

const { width, height } = Dimensions.get('window');

export default function Page() {
  const [showSearch, setSearch] = useState(false);
  const [search, setSearchValue] = useState("");
  const [weather, setWeather] = useState({});
  const [locations, setLocations] = useState([]);
  const [whole, setWhole] = useState(false);
  const [DailyForecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle search functionality
  const handleSearch = (text) => {
    console.log("Searching for:", text); // Debugging line
    if (!text) {
      setLocations([]);
      return;
    }
    fetchLocation(text)
      .then((data) => {
        console.log("Fetched location data:", data); // Debugging line
        setLocations(data[0]);
      })
      .catch((error) => {
        console.error("Error fetching location data:", error);
        setLoading(false);
      });
      
  };

  // Debounced search handler
  const handleTextDebounce = useCallback(
    debounce((text) => {
      handleSearch(text);
    }, 1200),
    []
  );

  // Fetch weather data for default city on initial load
  useEffect(() => {
    firstFetch();
  }, []);

  // Fetch weather data when locations are updated
  useEffect(() => {
    if (locations && locations.name) {
      console.log("Handling location:", locations); // Debugging line
      handleLocation(locations);
    }
  }, [locations]);

  // Fetch weather data for a specific location
  const handleLocation = (location) => {
    setLoading(true);
    console.log("Fetching weather for location:", location);
    storeData("city", location.name);
    setLoading(false);
    firstFetch();
  };

  // Fetch weather data for the default city on component mount
  const firstFetch = async () => {
    try {
      const city = await getData("city");
      const defaultCity = city || "Mumbai";
      console.log("Default city:", defaultCity); // Debugging line
      const data = await fetchWeatherForecast(defaultCity, 7);
      if (data && data.current && data.forecast) {
        setWeather(data.current);
        setWhole(data);
        setForecast(data.forecast.forecastday);
      } else {
        console.error("Unexpected data structure:", data);
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setLoading(false);
    }
  };


  const iconSource = iconsImages[weather.condition?.text] || iconsImages['other']; // Fallback to 'other' if not found

  // console.log(whole);
  // Render loading indicator if data is still being fetched
  if (loading) {
    return (
      <ImageBackground source={backgroundImg} resizeMode="cover" className="h-screen flex flex-1 justify-center items-center" style={{ paddingTop: 45 }}>
        <ActivityIndicator size='large' color="#0000ff" />
        <Text>Loading...</Text>
      </ImageBackground>
    );
  }

  return (
    <View className="flex flex-1">
      <ImageBackground source={backgroundImg} resizeMode="cover" className="h-screen" style={{ paddingTop: 45 }}>
        <View className="flex-row items-center justify-between mx-5 rounded-full">
          {showSearch && (
            <TextInput
              placeholder="Search City"
              placeholderTextColor="lightgray"
              value={search} // Binds the value to the state
              onChangeText={(e) => {
                // Should log the actual input value
                console.log(e);
                setSearchValue(e); // Updates state with the new value
                handleTextDebounce(e); // Passes the new value to the debounced function
              }}
              className="flex h-12 pl-6 text-lg text-white bg-['rgba(255,255,255,0.2)'] w-full rounded-full transition-all"
            />
          )}
          <TouchableOpacity
            onPress={() => setSearch(!showSearch)}
            className="rounded-full bg-['rgba(255,255,255,0.2)'] w-10 h-10 flex justify-center items-center absolute right-1 top-1"
          >
            <AntDesign name="search1" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <View className="items-center">
          <View style={{ marginTop: showSearch ? height * 0.032 : height * 0.08 }} >
            <Text className="text-2xl text-white self-center"><Text className="text-3xl font-bold">{whole.location.name}</Text>,{whole.location.country}</Text>
          </View>
          <View style={{ marginTop: height * 0.06 }}>
            <Image source={iconSource} style={{ height: height * 0.26, width: width * 0.55 }} />
          </View>
          <View>
            <Text style={{ marginTop: height * 0.05 }} className="text-6xl font-bold text-white self-center  ml-5">{weather.temp_c || '--'}&#176;</Text>
            <Text className="text-2xl text-white self-center mt-2 ml-2">{weather.condition?.text || 'No data'}</Text>
          </View>
          <View style={{ marginTop: height * 0.08 }} className="flex-row justify-between gap-16">
            <View className="flex-row justify-between">
              <Image source={require('../../assets/icons/wind.png')} className="h-6 mt-1 w-6" />
              <Text className="text-lg text-white ml-2">{weather.gust_kph || '--'}km</Text>
            </View>
            <View className="flex-row justify-between">
              <Image source={require('../../assets/icons/drop.png')} className="h-6 mt-1 w-6" />
              <Text className="text-lg text-white ml-2">{weather.humidity}%</Text>
            </View>
            <View className="flex-row justify-between">
              <Image source={require('../../assets/icons/sun.png')} className="h-6 mt-1 w-6" />
              <Text className="text-lg text-white ml-2">{whole.forecast.forecastday[0].astro.sunrise}</Text>
            </View>
          </View>
        </View>
        <View style={{ marginTop: height * 0.03 }} className="ml-7 flex-row items-center">
          <AntDesign name="calendar" size={18} color="white" />
          <Text className="text-base text-white ml-3 self-center">Daily Forecast</Text>
        </View>
        <ScrollView horizontal showsVerticalScrollIndicator={false} style={{ marginTop: height * 0.02 }} >
          {DailyForecast.map((items, index) => {
            const date = new Date(items.date);
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            const iconSource = iconsImages[items.day.condition.text] || iconsImages['other'];

            return (
              <View
                key={index}
                className="bg-white/30 items-center mt-2 mx-4 rounded-3xl"
                style={{ height: height * 0.13, width: width * 0.2 }}>
                <Image
                  source={iconSource}
                  className="h-10 w-10 mt-2" />
                <Text className="mt-2 text-white">{dayOfWeek}</Text>
                <Text className="text-xl mt-1 self-center ml-2 font-bold text-white">{items.day.avgtemp_c}&#176;</Text>
              </View>
            );
          })}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}
