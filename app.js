import express from 'express';
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
var merge = require('merge-deep');
const app = express();
var path = require('path');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.get('/status', (req, res) => {
    res.status(200).send({
        "Success": true,
        "Status": "API Online"
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/indexPage', (req, res) => {
    res.sendFile(path.join(__dirname + '/indexPage.html'));
});

app.get('/searchPage', (req, res) => {
    res.sendFile(path.join(__dirname + '/searchPage.html'));
});

app.post('/index', async (req, res) => {
    const data = req.body.data;
    indexParagraph(data);
    // const paras = data.split("\n\n");
    // await Promise.all(
    //     paras.map(async element => {
    //         console.log("para")
    //         await indexParagraph(element);
    //     }));
    res.status(200).send({
        "Success": true,
        "Status": "Indexing successful"
    });
});

app.get('/clear', (req, res) => {
    fs.writeFile('./db/para.json', JSON.stringify({}), (err) => {
        if (err) console.log('Error writing file:', err)
    });
    fs.writeFile('./db/words.json', JSON.stringify({}), (err) => {
        if (err) console.log('Error writing file:', err)
    });
    res.sendFile(path.join(__dirname + '/clear.html'));
    // res.status(200).send({
    //     "success": true,
    //     "status": "Index cleared."
    // });
});

app.put('/indexPDF', (req, res) => {
    console.log(JSON.stringify(req.body, null, 4));

    res.status(200).send({
        "Success": true,
        "Status": "Indexing successful"
    });
});

app.post('/search', (req, res) => {
    const word = req.body.word;
    var temp = {};
    var data = {};
    jsonReader('./db/words.json', (err, wordIndex) => {
        if (err) {
            console.log(err)
            return
        }
        temp = wordIndex[word];
        if (isEmpty(temp)) {
            res.status(200).send({
                "success": true,
                "data": null
            });
            return
        }
        jsonReader('./db/para.json', (err, para) => {
            if (err) {
                console.log(err)
                return
            }
            Object.keys(temp).forEach(paraID => {
                data[paraID] = para[paraID];
            });
            res.status(200).send({
                "success": true,
                "data": data
            });
        });
    });
});
function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
async function indexParagraph(data) {
    const docID = uuidv4();
    var words = {};
    jsonReader('./db/para.json', (err, para) => {
        if (err) {
            console.log(err)
            return
        }
        para[docID] = data;
        // console.log(JSON.stringify(para, null, 4));
        fs.writeFile('./db/para.json', JSON.stringify(para), (err) => {
            if (err) console.log('Error writing file:', err)
        })
    });
    // console.log(data);
    // console.log(JSON.stringify(data.split(/[ ,]+/)));
    data.split(/[ ,]+/).map(function (x) { return x.toLowerCase() }).forEach(word => {
        addWord(words, word, docID);
    });
    // console.log(JSON.stringify(words, null, 4));
    jsonReader('./db/words.json', (err, wordIndex) => {
        if (err) {
            console.log(err)
            return
        }
        wordIndex = merge(wordIndex, words);
        // console.log(JSON.stringify(wordIndex, null, 4));
        fs.writeFile('./db/words.json', JSON.stringify(wordIndex), (err) => {
            if (err) console.log('Error writing file:', err)
        })
    });
}
function jsonReader(filePath, cb) {
    fs.readFile(filePath, (err, fileData) => {
        if (err) {
            return cb && cb(err)
        }
        try {
            const object = JSON.parse(fileData)
            return cb && cb(null, object)
        } catch (err) {
            return cb && cb(err)
        }
    })
}

function addWord(words, word, docID) {
    if (words.hasOwnProperty(word)) {
        words[word][docID] = (words[word][docID] + 1) || 1;
    } else {
        words[word] = { [docID]: 1 };
    }
}

const PORT = 5000;
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${PORT}`);
});