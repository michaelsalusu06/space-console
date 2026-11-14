import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Formatter;
import java.util.Scanner;

public class report 
{
    public static void main(String[] args) 
    {
        String fuelData = "";
        ArrayList<String> messages = new ArrayList<String>();

        try 
        {
            File pipeFile = new File("pipeline.txt");
            if (pipeFile.exists()) 
            {
                Scanner sc = new Scanner(pipeFile);
                while (sc.hasNextLine()) 
                {
                    fuelData += sc.nextLine().trim() + "\n";
                }
                sc.close();
            }

            File msgFile = new File("messages.txt");
            if (msgFile.exists()) 
            {
                Scanner sc2 = new Scanner(msgFile);
                while (sc2.hasNextLine()) 
                {
                    String line = sc2.nextLine().trim();
                    if (!line.isEmpty()) 
                    {
                        messages.add(line);
                    }
                }
                sc2.close();
            }

            Collections.sort(messages);

            Formatter f = new Formatter("Captains_Log.txt");
            f.format("=== CAPTAIN'S LOG ===%n%n");
            f.format("--- REACTOR STATUS ---%n%s%n", fuelData);
            f.format("--- COMMUNICATIONS LOG (SORTED) ---%n");

            if (messages.isEmpty()) 
            {
                f.format("No communications logged yet.%n");
            } 
            else 
            {
                for (String msg : messages) 
                {
                    f.format("%s%n", msg);
                }
            }

            f.close();
            System.out.println("Captains_Log.txt updated.");
        } 
        catch (Exception e) 
        {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
