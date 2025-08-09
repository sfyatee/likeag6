// locationsearch.js
// This module provides functionality to search for location destinations.
let inputstring = "";
const exampleLocations = ["Tokyo", "Delhi" ,"Shanghai", "São_Paulo" ,"Mexico City", 
    "Cairo Mumbai", "Beijing", "Dhaka", "Osaka", "New York City", "Tehran", "Karachi", 
    "Kolkata", "Buenos Aires", "Chongqing", "Istanbul", "Manila", "Lagos","Rio de Janeiro"
, "Tianjin", "Kinshasa", "Guangzhou", "Los Angeles", "Moscow", "Shenzhen", "Lahore"
, "Bengaluru", "Paris", "Bogotá", "Jakarta", "Chennai", "Lima", "Bangkok", "Seoul", "Nagoya"
, "Hyderabad", "London", "Chicago", "Chengdu", "Nanjing", "Wuhan", "Ho Chi Minh City"
, "Luanda", "Ahmedabad", "Kuala Lumpur", "Xi'an", "Hong Kong", "Dongguan", "Hangzhou"
, "Foshan", "Shenyang", "Riyadh", "Baghdad", "Santiago", "Surat", "Madrid", "Suzhou", "Pune"
, "Harbin", "Houston", "Dallas", "Toronto", "Dar es Salaam", "Miami", "Belo Horizonte"
, "Singapore", "Philadelphia", "Atlanta", "Fukuoka", "Khartoum", "Barcelona", "Johannesburg"
, "Saint Petersburg", "Qingdao", "Dalian", "Washington", "Yangon", "Alexandria", "Jinan"
, "Guadalajara"];
export function locationSearch(input) 
{
    inputstring = input;
    if (inputstring.length > 0) 
    {
        // Simulate a search operation
        console.log("Searching for locations related to: " + inputstring);
        let results = exampleLocations.filter(location =>  
            location.toLowerCase().includes(inputstring.toLowerCase())
        );
        if (results.length > 0) 
        {
            console.log("Search results found: " + results.join(", "));
        } else 
        {
            let partialResults = exampleLocations.filter(location => 
                location.toLowerCase().includes(inputstring.toLowerCase())
            );
            if (partialResults.length > 0) 
            {
                console.log("Partial matches found: " + partialResults.join(", "));
            } else 
            {
                console.log("No matches found for: " + inputstring);
            }
        }
    } else 
    {
        console.log("Please enter a location.");
    }
}