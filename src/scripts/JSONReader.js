class JSONReader {
    constructor(src, callback) {
        this.src = src;
        let json;
        fs.readFile(this.src, "utf8", (err, data) => {
            if (err) {
                fs.mkdir(this.src.substr(0, this.src.length - "config.json".length,), () => {
                    fs.writeFile(this.src, `{"general": {"ip": "","port": "","theme": "Light Blue","webcamEnabled": false,"showSkeleton": true},"performance": {"architecture": "MobileNetV1","stride": "16","multiplier": "0.5","quant": "2"},"kodis": []}`, function (err) {
                        if (err) throw err;
                        console.log('File is created successfully.');
                        let win = remote.getCurrentWindow();
                        win.reload();
                    });
                });

            } else {
                json = data;
                this.JSONData = JSON.parse(json);
                if (callback) {
                    callback();
                }
            }
        });

    }

    save(callback) {
        var jsonContent = JSON.stringify(this.JSONData);
        if (callback) {
            fs.writeFile(this.src, jsonContent, 'utf8', callback);
        } else {
            fs.writeFile(this.src, jsonContent, 'utf8');

        }
    }

    getActionFromGesture(gestureName, status) {
        for (let i in this.JSONData.gesture_bindings) {
            let binding = this.JSONData.gesture_bindings[i];
            if (binding.gesture === gestureName && binding.status === status) {
                return binding;
            }
        }
        console.error("Error, no command found for this gesture");
    }

    getGestureFromAction(actionName, status) {
        for (let i in this.JSONData.gesture_bindings) {
            let binding = this.JSONData.gesture_bindings[i];
            if (binding.action === actionName && binding.status === status) {
                return binding.gesture;
            }
        }
        console.error("Error, no command found for this gesture");
    }

    overwriteSetting(settingName, value) {
        this.JSONData.general[settingName] = value;
    }

    overwritePerformanceSetting(settingName, value) {
        this.JSONData.performance[settingName] = value;
    }

    addKodi(ip, port) {
        let exists = this.JSONData.kodis.find((k) => {
            return (k.ip === ip && k.port === port)
        });
        console.log(exists);
        if (exists === undefined) {
            this.JSONData.kodis.push({
                'ip': ip,
                'port': port
            });
        }
    }

    readSetting(settingName) {
        return this.JSONData.general[settingName];
    }

    readPerformanceSetting(settingName) {
        return this.JSONData.performance[settingName];
    }

    readKodis() {
        return this.JSONData.kodis;
    }

    emptyKodis() {
        this.JSONData.kodis = [];
    }

    overwriteAction(gestureName, status, newAction) {
        let newBinding = {
            "gesture": gestureName,
            "status": status,
            "action": newAction
        };
        for (let i in this.JSONData.gesture_bindings) {
            let binding = this.JSONData.gesture_bindings[i];
            if (binding.gesture === gestureName && binding.status === status) {
                this.JSONData.gesture_bindings[i] = newBinding;
                console.log(this.JSONData.gesture_bindings[i]);
                return;
            }
        }
        this.JSONData.gesture_bindings.push(newBinding);
    }
}

module.exports = JSONReader;