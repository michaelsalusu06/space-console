using System;
using System.IO;
using System.Diagnostics;

long FuelMass = 0;
long FuelPK = 15;
long Distance = 100;

if (args.Length > 0)
{
    long.TryParse(args[0], out FuelMass);
}

if (args.Length > 1 && long.TryParse(args[1], out long parsedDistance) && parsedDistance > 0)
{
    Distance = parsedDistance;
}

long temp = FuelPK * Distance;
double burnRate = (double)temp / Distance;
long remaining = FuelMass - temp;
long maxRange = FuelMass / FuelPK;
string status = "";

if (FuelMass < temp)
{
    status = "Not Enough Fuel";
    Console.WriteLine(status);
}
else
{
    status = "Fuel is enough";
    Console.WriteLine(status);
}

string result = "Fuel Mass: " + FuelMass + " kg\n" +
                "Jump Distance: " + Distance + " km\n" +
                "Burn Rate: " + burnRate + " kg/km\n" +
                "Required Fuel: " + temp + " kg\n" +
                "Remaining Fuel: " + remaining + " kg\n" +
                "Max Range: " + maxRange + " km\n" +
                "Status: " + status;

File.WriteAllText("pipeline.txt", result);

Process.Start("java", "report")?.WaitForExit();
