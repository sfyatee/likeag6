// locationsearch.js
// This module provides functionality to search for location destinations.
let inputstring = "";
const exampleLocations = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];
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