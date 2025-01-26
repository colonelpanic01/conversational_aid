const fs = require('fs'); // Import the 'fs' module for file system operations
const admin = require('firebase-admin');
const serviceAccount = require('./mchacks-f5af9-firebase-adminsdk-fbsvc-1c6cd39f04.json'); // Assuming the file is in the same directory

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mchacks-f5af9-default-rtdb.firebaseio.com/' // Replace with your actual database URL
});

const db = admin.database().ref('convoFlow');

async function fetchDataFromFirebase() {
  try {
    const snapshot = await db.once('value');
    const data = snapshot.val();

    if (data) {
      const hashMap = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          hashMap[key] = data[key];
        }
      }
      return hashMap;
    } else {
      console.log("No data found in Firebase.");
      return null;
    }
  } catch (error) {
    console.error('Error fetching data from Firebase:', error);
    return null;
  }
}

async function overwriteFile(filePath, data) {
  try {
    await fs.promises.writeFile(filePath, data, 'utf8');
    console.log(`File "${filePath}" overwritten successfully.`);
  } catch (err) {
    console.error(`Error overwriting file "${filePath}":`, err);
  }
}

function readKeyValuePairsFromFile(filePath) {
    try {
      const fs = require('fs');
      const data = fs.readFileSync(filePath, 'utf-8').split('\n'); 
      const keyValuePairs = {};
  
      data.forEach(line => {
        const [key, ...valueParts] = line.split(':'); 
        if (key && valueParts.length > 0) { 
          keyValuePairs[key.trim()] = valueParts.join(':').trim(); 
        }
      });
  
      return keyValuePairs;
  
    } catch (error) {
      console.error(`Error reading file: ${error}`);
      return {}; 
    }
  }
  

async function main() {
  while(true){
    let s = "";
    var hashMap = await fetchDataFromFirebase();
    var fileVal = await readKeyValuePairsFromFile("firbaseDB/server.txt");
    if (hashMap && fileVal) {
        for (const key in hashMap) {
            for(const things in fileVal){
                if(fileVal[things] != hashMap[key]){
                    s = ""
                    for (const i in hashMap) {
                        s += `${i}: ${hashMap[i]}\n`; // Use template literal for readability
                    }
                    break
                }
            }
        }
        await overwriteFile("firbaseDB/server.txt", s);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
    }
}

main();