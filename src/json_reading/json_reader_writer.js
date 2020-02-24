const fs = require('fs');


function getActionFromGesture(gestureName, status){
    let bindings;
    try {
        const jsonString = fs.readFileSync('src/json_reading/config.json');
        bindings = JSON.parse(jsonString);
        console.log(bindings);
    } catch(err) {
        console.log(err);
    }
    for(let i in bindings.gesture_bindings){
        let binding = bindings.gesture_bindings[i];
        if (binding.gesture === gestureName && binding.status === status){
            return binding;
        }
    }
    console.error("Error, no command found for this gesture");
}

function overwriteSetting(settingName, value){
    let bindings;
    try {
        const jsonString = fs.readFileSync('src/json_reading/config.json');
        bindings = JSON.parse(jsonString);
    } catch(err) {
        console.log(err);
    }
    bindings.general[settingName] = value;
    var jsonContent = JSON.stringify(bindings);
    fs.writeFile("src/json_reading/config.json", jsonContent, 'utf8', function (err) {
        if (err) {
            console.log("An error occurred while writing JSON Object to File.");
            return console.log(err);
        }

        console.log("JSON file has been saved.");
    });
}
function readSetting(settingName){
    let bindings;
    try {
        const jsonString = fs.readFileSync('src/json_reading/config.json');
        bindings = JSON.parse(jsonString);
    } catch(err) {
        console.log(err);
    }
    return bindings.general[settingName];
}

function overwriteAction(gestureName, status, newAction){
    let bindings;
    try {
        const jsonString = fs.readFileSync('src/json_reading/config.json');
        bindings = JSON.parse(jsonString);
    } catch(err) {
        console.log(err);
    }
    let newBinding ={"gesture": gestureName,"status": status, "action": newAction};
    for(let i in bindings.gesture_bindings){
        let binding = bindings.gesture_bindings[i];
        if (binding.gesture === gestureName && binding.status === status){
            bindings.gesture_bindings[i] = newBinding;
            console.log(bindings.gesture_bindings[i]);
            var jsonContent = JSON.stringify(bindings);
            fs.writeFile("src/json_reading/config.json", jsonContent, 'utf8', function (err) {
                if (err) {
                    console.log("An error occurred while writing JSON Object to File.");
                    return console.log(err);
                }

                console.log("JSON file has been saved.");
            });
        }
    }
}

