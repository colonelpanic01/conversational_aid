const admin = require('firebase-admin');
const serviceAccount = require('./mchacks-f5af9-firebase-adminsdk-fbsvc-1c6cd39f04.json')
// Initialize Firebase Admin SDK with the provided database URL
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mchacks-f5af9-default-rtdb.firebaseio.com/' // Your Firebase Realtime Database URL
});

const db = admin.database().ref("convoFlow");

// Watch the folder for changes
const fs = require('fs');
const path = require('path');
const folderPath = path.resolve(__dirname, '../LLM_backend_server/ContactData/'); // Assuming the directory is one level above the script

// Function to upload file content to Firebase Realtime Database
function uploadFileToFirebase(fileName, fileContent) {
  db.child(fileName).set(fileContent)
    .then(() => {
      console.log(`File "${fileName}" uploaded or updated successfully in Firebase.`);
    })
    .catch((error) => {
      console.error("Error uploading file content:", error);
    });
}

// Watch the folder for file changes
fs.watch(folderPath, (eventType, fileName) => {
  if (eventType === 'rename' || eventType === 'change') {
    const filePath = path.join(folderPath, fileName);

    // Check if the file exists and is a .txt file
    if (fs.existsSync(filePath) && fileName.endsWith('.txt')) {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          return;
        }

        // Check if the file name already exists in Firebase
        var key = fileName.split('.')[0]
        db.child(key).once('value', (snapshot) => {
          if (snapshot.exists()) {
            console.log(`File "${fileName}" exists. Updating the content...`);
          } else {
            console.log(`File "${fileName}" is new. Adding it to Firebase...`);
          }

          // Upload the file content to Firebase Realtime Database
          uploadFileToFirebase(key, data);
        });
      });
    }
  }
});

function pushEmptyKeys() {
  const emptyKeys = {
    alex: " ",    // Key 'alex' with null value
    emma: " ",     // Key 'emma' with an empty string value
    rohan: " " // Key 'rohan' with undefined value
  };

  // Push the empty keys to Firebase
  db.update(emptyKeys)
    .then(() => {
      console.log("Three empty keys (alex, emma, rohan) were pushed to Firebase.");
    })
    .catch((error) => {
      console.error("Error pushing empty keys:", error);
    });
}

pushEmptyKeys();


console.log(`Watching for file changes in "${folderPath}"...`);
