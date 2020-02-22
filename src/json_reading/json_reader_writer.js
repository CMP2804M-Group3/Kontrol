const config = require('./config.json');
const fs = require('fs');


function getActionFromGesture( gestureName, status){
    let bindings;
    try {
        const jsonString = fs.readFileSync('./config.json');
        let bindings = JSON.parse(jsonString);
    } catch(err) {
        console.log(err);
    }

    for(i = 0; i < bindings.length; i++){
        if (bindings.gesture_action_bindings[i].gesture === gestureName &&
            bindings.gesture_action_bindings[i].status === status){
            break;
        }
        if (i == binding.length) {
            console.error("Error, no command found for this gesture");
        }
}
}

function overwriteAction(gestureName, status, newAction){
    let bindings;
    try {
        const jsonString = fs.readFileSync('./config.json');
        bindings = JSON.parse(jsonString);
    } catch(err) {
        console.log(err);
    }
    let newBinding ={"gesture": gestureName,"status": status, "action": newAction};

    for(i = 0; i < bindings.length; i++){
        if (bindings.gesture_action_bindings[i].gesture === gestureName &&
            bindings.gesture_action_bindings[i].status === status){
            break;
        }
        bindings.splice(i,1);
        bindings.insert(i,newBinding);

}
}

