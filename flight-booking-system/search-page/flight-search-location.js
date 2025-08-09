// flight-search-location.js - handles flight search functionality
import {locationSearch} from "../shared-code/util/locationSearch.js";

// variables to store user's departure and arrival choice
let departureLocation, arrivalLocation;

// arrays of sample data to make flights look more realistic
const airlines = ["American Airlines", "Delta", "United", "Southwest", "JetBlue", "Alaska Airlines", "Spirit", "Frontier Airlines"];
const aircraftTypes = ["Boeing 737", "Boeing 777", "Airbus A320", "Airbus A330", "Boeing 747"];

// function to add extra details to basic csv flight data
const enhanceFlightData = (csvFlight) => {
    return {
        ...csvFlight,
        // generate random flight id
        id: `FL${Math.floor(Math.random() * 9000) + 1000}`,
        // pick random airline from our list
        airline: airlines[Math.floor(Math.random() * airlines.length)],
        // pick random aircraft type
        aircraft: aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)],
        // generate random flight duration
        duration: `${Math.floor(Math.random() * 6) + 1}h ${Math.floor(Math.random() * 60)}m`,
        // 70% chance of direct flight, 30% chance of 1 stop
        stops: Math.random() < 0.7 ? "Direct" : "1 Stop"
    };
};

// main function to search for flights
const flightSearchResults = () => {
    // get values from search form inputs
    departureLocation = document.getElementById("departure").value;
    arrivalLocation = document.getElementById("arrival").value;
    const departureDate = document.getElementById("departureDate").value;

    // check if all fields are filled out
    if(!departureLocation || !arrivalLocation || !departureDate){
        alert("please fill out all search criteria");
        return;
    }

    // use location search to validate departure and arrival locations
    console.log("Searching departure location:");
    locationSearch(departureLocation);
    console.log("Searching arrival location:");
    locationSearch(arrivalLocation);

    // load flight data from csv file
    fetch("../shared-code/data/flight-data.csv")
        .then(response => response.text())
        .then(data => {
            // array to store flights that match search criteria
            let filterData = [];
            // split csv data into individual rows
            const rows = data.split('\n');

            // loop through each row (skips header row at index 0)
            for (let i = 1; i < rows.length; i++){
                const row = rows[i].trim();
                // skip empty rows
                if (!row) continue;

                // split row into columns (departure, arrival, date, time)
                const columns = row.split(',');

                // extract data from each column
                const csvDeparture = columns[0].trim();
                const csvArrival = columns[1].trim();
                const csvDepartureDate = columns[2].trim();
                const csvDepartureTime = columns[3].trim();

                // log what we're comparing for debugging
                console.log(`Checking: ${csvDeparture} -> ${csvArrival} on ${csvDepartureDate}`);
                console.log(`Against: ${departureLocation} -> ${arrivalLocation} on ${departureDate}`);

                // check if this flight matches search criteria
                if(csvDeparture !== departureLocation) continue;
                if(csvArrival !== arrivalLocation) continue;
                if(csvDepartureDate !== departureDate) continue;

                // if we get here, it's a match :D
                console.log("Match found!");
                filterData.push({
                    departure: csvDeparture,
                    arrival: csvArrival,
                    departureDate: csvDepartureDate,
                    departureTime: csvDepartureTime
                });
            }

            console.log(`Found ${filterData.length} flights`);

            // add extra details to each matching flight
            const enhancedFlights = filterData.map(flight => enhanceFlightData(flight));

            // save results & go to results page
            saveFlightSearchResults(enhancedFlights);
            window.location.href = "../results-page/flight-search-results.html";
        })
        .catch(error => {
            // handle errors when loading csv file
            console.error('Error fetching flight data:', error);
            alert('Error loading flight data. Please try again.');
        });
}

// function to save search results for use on results page
const saveFlightSearchResults = (flights) => {
    // store flight data globally so results page can access it
    window.flightSearchData = {
        departureLocation: departureLocation,
        arrivalLocation: arrivalLocation,
        flightResults: flights
    };
}

// set up event listener when page loads
document.addEventListener('DOMContentLoaded', () => {
    // find search button and add click event
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', flightSearchResults);
    }
});