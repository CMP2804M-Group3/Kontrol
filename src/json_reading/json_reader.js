const config = require('./config.json');
const fs = require('fs');
try {
    const jsonString = fs.readFileSync('./config.json')
    const bindings = JSON.parse(jsonString)
} catch(err) {
    console.log(err)
    return
}

function getActionFromGesture(var gestureName,var status){
    for(i = 0, i < bindings.length){
        if (bindings.gesture_action_bindings[i].gesture == gestureName &&
            bindings.gesture_action_bindings[i].status == status{
            break;
        }
    }
}

