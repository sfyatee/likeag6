//import seat gen from k'yahn
import { generateSeats } from '../shared-code/util/SeatGen.js';

// array to store seats that have been selected
let selectedSeats = [];

// create seat map
function createSeatMap() {
    // generate a seat map with 10 rows and 6 seats per row (a-f)
    const seatMap = generateSeats(10, 6);

    // html for the seat map
    let html = `
        <div class="seat-map-container" style="display:none;" id="seatMap">
            <h4>Select Your Seats</h4>
            <p>Blue = Available | Red = Occupied | Green = Selected</p>`;

    // loop through each row to make seats
    seatMap.forEach(row => {
        html += '<div class="seat-row">';
        row.forEach((seat, j) => {
            // make some seats occupied for demo, not yet randomized
            const isOccupied = ['1A', '1B', '3C', '5F', '7D'].includes(seat.label);
            // set seat class based on availability
            const seatClass = isOccupied ? 'occupied' : 'available';
            // create clickable seat element
            html += `<div class="seat ${seatClass}" onclick="selectSeat('${seat.label}')">${seat.label}</div>`;
            // add aisle space after seat c
            if (j === 2) html += '<div class="aisle"></div>';
        });
        html += '</div>';
    });

    // add selected seats display area
    html += `<p>Selected: <span id="selectedList">None</span></p></div>`;
    return html;
}

// seat selection function
window.selectSeat = function(seatLabel) {
    // find the seat element that was clicked
    const seatElement = document.querySelector(`[onclick="selectSeat('${seatLabel}')"]`);

    // don't allow selection of occupied seats
    if (seatElement.classList.contains('occupied')) return;

    // check if seat is already selected
    if (selectedSeats.includes(seatLabel)) {
        // deselect the seat, remove from array and change color
        selectedSeats = selectedSeats.filter(s => s !== seatLabel);
        seatElement.className = 'seat available';
    } else {
        // select the seat, add to array and change color
        selectedSeats.push(seatLabel);
        seatElement.className = 'seat selected';
    }

    // update the display of selected seats
    updateSummary();
};

// update selected seats display
function updateSummary() {
    // find the element that shows selected seats
    const listEl = document.getElementById('selectedList');
    if (listEl) {
        // show selected seats or none if nothing selected
        listEl.textContent = selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None';
    }

    // enable/disable continue button based on seat selection
    const btn = document.getElementById('continueBtn');
    if (btn) {
        // disable button if no seats selected
        btn.disabled = selectedSeats.length === 0;
    }
}

// show/hide seats function
window.showSeats = function() {
    // get the seat map container and button
    const container = document.getElementById('seatMap');
    const button = document.getElementById('seatBtn');

    // toggle visibility of seat map
    if (container.style.display === 'none') {
        // show the seat map
        container.style.display = 'block';
        button.textContent = 'Hide Seats';
    } else {
        // hide the seat map
        container.style.display = 'none';
        button.textContent = 'Select Seats';
    }
};

// go to checkout (no pricing logic yet)
window.goToCheckout = function() {
    // make sure user selected at least one seat
    if (selectedSeats.length === 0) {
        alert('Please select at least one seat.');
        return;
    }

    // create url parameters to pass selected seats to checkout page
    const urlParams = new URLSearchParams({
        flightId: 'FL1001',
        selectedSeats: selectedSeats.join(',')
    });

    // navigate to checkout page with seat info
    window.location.href = `../checkout-page/checkout-page.html?${urlParams.toString()}`;
};

// display flights function
function displayFlights() {
    // get the container where flights will be displayed
    const container = document.getElementById("searchFlights");

    // create html for flight display with seat selection
    const html = `
        <h2>Available Flights</h2>
        <div class="flight-info">
            <h3>American Airlines - FL1001</h3>
            <p>LAX → JFK | 08:00 | 5h 30m</p>

            <button id="seatBtn" onclick="showSeats()">Select Seats</button>
            ${createSeatMap()}

            <button id="continueBtn" onclick="goToCheckout()" disabled>Continue to Checkout</button>
        </div>
    `;

    // put the html into the container
    container.innerHTML = html;
}

// initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // only run if we're on the search flights page
    if (document.getElementById('searchFlights')) {
        displayFlights();
    }
});