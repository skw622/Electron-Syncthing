// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const exec = require('child_process').exec;
    const fixPath = require('fix-path');

    console.log(process.env.PATH);
    //=> '/usr/bin'

    fixPath();

    console.log(process.env.PATH);
    //=> '/usr/local/bin:/usr/bin'

    window.$ = window.jQuery = require('jquery')
    const { remote } = require('electron');
    // let exePath = "./syncthing/sysncthing.app"
    const axios = require('axios')
    let cookie = '';

    document.getElementById('close').addEventListener('click', closeWindow);
    document.getElementById('minimize').addEventListener('click', minimizeWindow);
    document.getElementById('max').addEventListener('click', maximizeWindow);
    document.getElementById('fetch_data').addEventListener('click', fetchData);
    document.getElementById('url').addEventListener('keyup', (event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById("fetch_data").click();
        }
    })

    async function closeWindow() {

        exec('brew services stop syncthing', (error, res, ss) => {
            console.log('starta')
            if (error) console.log(error)
        })
        setTimeout(() => {
            window.close()
        }, 1000);
    }

    function maximizeWindow() {
        let window = remote.getCurrentWindow()
        window.isMaximized() ? window.unmaximize() : window.maximize()
    }

    function minimizeWindow() {
        let window = remote.getCurrentWindow()
        window.minimize()
    }

    async function fetchData() {
        let response = await axios.get('http://127.0.0.1:8384/').then(res => {
            return res.headers
        })
        if (response['set-cookie']) {
            cookie = response['set-cookie'][0]
        }
        let csrf_token_header = cookie.split('=')[0]
        let csrf_token = cookie.split('=')[1]
        let method = $("#method option:selected").text();
        let url = document.getElementById('url').value;
        axios.defaults.headers = {
            'Cookie': cookie,
        }
        axios.defaults.headers['X-' + csrf_token_header] = csrf_token
        if (method == 'GET') {
            axios.get('http://127.0.0.1:8384/' + url).then(res => {
                document.getElementById('preview').innerHTML = `<pre>` + `${(JSON.stringify(res.data, null, "\t"))}` + `</pre>`
            })
                .catch(error => {
                    document.getElementById('preview').innerHTML = `<pre>` + error + `</pre>`
                })
        }
        if (method == 'POST') {
            axios.post('http://127.0.0.1:8384/' + url).then(res => {
                document.getElementById('preview').innerHTML = `<pre>` + `${(JSON.stringify(res.data, null, "\t"))}` + `</pre>`
            })
                .catch(error => {
                    document.getElementById('preview').innerHTML = `<pre>` + error + `</pre>`
                })
        }

    }

    function isInstalled() {
        return new Promise((resolve, reject) => {
            exec('brew list', (error, list, ss) => {
                if (error) console.log('error', error)
                if (list) { resolve(list); console.log(list) }
                if (ss) console.log('sssssss', ss)
            })
        })
    }

    function findSyncthing(isInstalledList) {
        return new Promise((resolve, reject) => {
            if (isInstalledList.includes('syncthing')) {
                resolve('true')
            } else {
                resolve('false')
            }
        })
    }

    async function initializing() {
        let isInstalledList = await isInstalled();
        console.log(isInstalledList)
        let isSyncthing = await findSyncthing(isInstalledList);
        if (isSyncthing == 'true') {
            console.log('Syncthing app is installed already. Running Syncthing...')
            exec('brew services start syncthing', (error, res, ss) => {
                console.log('starta')
                if (error) console.log(error)
                if (res) {
                    if(res.includes('restart')){
                        console.log('restart')
                        exec('brew services start syncthing',(error, res, warning)=>{
                            if(error) console.log(error)
                            if(res) console.log(res)
                            if(warning) console.log(warning)
                        })
                    }
                    console.log(res)
                }
                if (ss) console.log(ss)

            })
            setTimeout(() => {
                $('#loading').addClass('d-none');
                $('#mainform').removeClass('d-none')
            }, 3000)
        } else if (isSyncthing == 'false') {
            console.log('Syncthing is not installed yet. Installing Syncthing...')
            exec('brew install syncthing', (error, result, warning) => {
                if (error) console.log('error', error)
                if (result) {
                    exec('brew services start syncthing', (error, res, ss) => {
                        if (error) console.log(error)
                        if (res) {
                            console.log(res)
                        }
                        if (ss) console.log(error)

                    })
                    setTimeout(() => {
                        $('#loading').addClass('d-none');
                        $('#mainform').removeClass('d-none')
                    }, 3000)
                }
                if (warning) {
                    exec('brew services start syncthing', (error, res, ss) => {
                        if (error) console.log(error)
                        if (res) {
                            console.log(res)
                        }
                        if (ss) console.log(error)
                    })
                    setTimeout(() => {
                        $('#loading').addClass('d-none');
                        $('#mainform').removeClass('d-none')
                    }, 3000)
                }
            })
        }
    }


    initializing();

})


