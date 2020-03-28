class JSONReader {
    constructor(src, callback) {
        this.src = src;
        let json;
        fs.readFile(this.src, "utf8", (err, data) => {
            if (err) {
                fs.mkdir(this.src.substr(0, this.src.length - "config.json".length,), () => {
                    fs.writeFile(this.src, `{
                        "general": {
                            "ip": "",
                            "port": "",
                            "theme": "Light Blue",
                            "webcamEnabled": false,
                            "showSkeleton": true
                        },
                        "performance": {
                            "architecture": "MobileNetV1",
                            "stride": "16",
                            "multiplier": "0.5",
                            "quant": "2"
                        },
                        "gesture_bindings": {
                            "play": "T Pose",
                            "volumeDown": "Left arm 90deg up",
                            "previous": "Left arm up",
                            "next": "Right arm up",
                            "rewind": "Left arm out",
                            "fastForward": "Right arm out",
                            "mute": "Ears Covered",
                            "action": "Left arm 90deg up",
                            "T Pose": "play"
                    
                        },
                        "kodis": [
                            {
                                "ip": "127.0.0.1",
                                "port": "8080"
                            }
                        ]
                    }`, function (err) {
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
            fs.writeFile(this.src, jsonContent, 'utf8', () => {
            });

        }
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

    overwriteAction(action, pose) {
        this.JSONData.gesture_bindings[action] = pose;
    }

    getActionFromGesture(gestureName) {
        function getKeyByValue(object, value) {
            return Object.keys(object).find(key => object[key] === value);
        }

        return getKeyByValue(this.JSONData.gesture_bindings, gestureName);
    }

    getGestureFromAction(actionName) {
        return this.JSONData.gesture_bindings[actionName];
    }


}

module.exports = JSONReader;