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
    for(let i in bindings.gesture_action_bindings){
        let binding = bindings.gesture_action_bindings[i];
        if (binding.gesture === gestureName && binding.status === status){
            return binding;
        }
    }
    console.error("Error, no command found for this gesture");
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
    for(let i in bindings.gesture_action_bindings){
        let binding = bindings.gesture_action_bindings[i];
        if (binding.gesture === gestureName && binding.status === status){
            bindings.gesture_action_bindings[i] = newBinding;
            console.log(bindings.gesture_action_bindings[i]);
        }
    }
}

