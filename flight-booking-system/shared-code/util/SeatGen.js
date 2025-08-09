//SeatGen.js
// This module generates seats to be filled by passengers.
export function generateSeats(rows, columns) 
{
  if (rows <= 0 || columns <= 0 || !Number.isInteger(rows) || !Number.isInteger(columns))
  {
    throw new Error("Rows and columns must be postitive integers");
  }
    let seatMap = [];
    for (let i = 0; i < rows; i++) 
    {
        let row = [];
        for (let j = 0; j < columns; j++) 
        {
            const columnLetter = String.fromCharCode(65 + j);
            row.push
            ({ 
                label: `${i + 1}${columnLetter}`,
                row: i + 1, 
                column: columnLetter, 
                occupied: false
            });
        }
        seatMap.push(row);
    }
    console.log("Seat map generated with " + rows + " rows and " + columns + " columns.");
    return seatMap;
}   
export function printSeatMap(seatMap) 
{
  for (const row of seatMap) 
    {
    const rowDisplay = row.map(seat => 
      `${seat.label}${seat.occupied ? ' (X)' : ' ( )'}`
    ).join("  ");
    console.log(rowDisplay);
  }
}