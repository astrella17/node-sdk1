var express = require('express');
var router = express.Router();

// npm install multer --save
const multer = require('multer');
//첨부한 파일을 폴더에 저장, 메모리 값
const upload = multer({storage:multer.memoryStorage()}); 

// npm install mongodb --save
const mongoclient = require('mongodb').MongoClient;
const ObjectId =  require('mongodb').ObjectId;
// 아이디:암호@서버주소:포트번호/DB명
const mongourl = 'mongodb://admin:1234@10.0.2.15:27017/admin'; 

// 수정하기
// http://127.0.0.1:13000/board/update
router.put('/update', async function(req, res, next) {
    try {
        //0. 전달된 값 받기
        const _id = req.body._id;

        const obj = {
            title : req.body.title,
            content : req.body.content,
            writer : req.body.writer,
            hit : req.body.hit,
        }

         // 3. DB연결
         const dbconn = await mongoclient.connect(mongourl, {});

         // 4. DB선택 및 컬렉션(테이블)선택
         const collection = dbconn.db("db01").collection("board");
 
         // 5. DB에 수정하기
         const query = {_id : ObjectId(_id)}; // 조건
         await collection.updateOne(query, {$set:obj});
 
         // 6. DB닫기
         dbconn.close();
 
         // 7. node-sdk -> vue-sdk로 전달
         res.send({ret:1, data:'DB에서 수정했습니다.'});
    }
    catch(err) {
        console.error(err);
        res.send({ret:-1, data:err});
    }
});

// 게시물 삭제
// 127.0.0.1:13000/board/delete
router.delete('/delete', async function(req, res, next) {
    try {
        // 0. 전달된 _id받기 ?_id=asdf
        const _id = req.query._id; //asdf

        // 3. DB연결
        const dbconn = await mongoclient.connect(mongourl, {});

        // 4. DB선택 및 컬렉션(테이블)선택
        const collection = dbconn.db("db01").collection("board");

        // 5. DB에 추가
        const query = {_id : ObjectId(_id)}; // 조건
        await collection.deleteOne(query);

        // 6. DB닫기
        dbconn.close();

        // 7. node-sdk -> vue-sdk로 저장
        res.send({ret:1, data:'DB에서 삭제했습니다.'});
    }
    catch(err) {
        console.error(err);
        res.send({ret:-1, data:err});
    }
});

//
router.get('/selectone', async function(req, res, next) {
    try {
        // 0. 전달되는 거우힌 키_id값 받기
        const _id = req.query._id;
        // 3. DB연결
        const dbconn = await mongoclient.connect(mongourl, {});

        // 4. DB선택 및 컬렉션(테이블)선택
        const collection = dbconn.db("db01").collection("board");

        // 5. DB에서 _id가 일치하는 한 개의 정보 가져오기
        // 단, 속도가 느리기 때문에 file관련 자료는 가져오지 않음
        const query = {_id : ObjectId(_id)}; // 조건
        const rows = await collection.findOne(query, 
            {projection : {filename:0, filedata:0, mimetype:0, filesize:0} });
        console.log(rows);

        // 6. DB닫기
        dbconn.close();

        // 7. node-sdk -> vue-sdk로 전달
        res.send({ret:1, data:rows});
    }
    catch(err) {
        console.error(err);
        res.send({ret:-1, data:err});
    }
});


// ObjectId("6103668072b2572305a74826")
// ObjectId("6103668072b2572305a74825")
// http://127.0.0.1:13000/board/image?_id=6103668072b2572305a74826
router.get('/image', async function(req, res, next) {
    try {
        // 0. 전달된 _id받기 ?_id=asdf
        const _id = req.query._id; //asdf

        // 3. DB연결
        const dbconn = await mongoclient.connect(mongourl, {});

        // 4. DB선택 및 컬렉션(테이블)선택
        const collection = dbconn.db("db01").collection("board");

        // 5. DB에 추가
        const query = {_id : ObjectId(_id)}; // 조건
        const rows = await collection.findOne(query, {filename:1, 
                filedata:1, mimetype:1, filesize:1 });
        console.log(rows);

        // 6. DB닫기
        dbconn.close();

        // 7. 이미지 표시
        res.contentType(rows.mimetype);
        res.send(rows.filedata.buffer);
        res.end();
    }
    catch(err) {
        console.error(err);
        res.send({ret:-1, data:err});
    }
});


// http://127.0.0.1:13000/board/select
router.get('/select', async function(req, res, next) {
    try {
        // 3. DB연결
        const dbconn = await mongoclient.connect(mongourl, {});

        // 4. DB선택 및 컬렉션(테이블)선택
        const collection = dbconn.db("db01").collection("board");

        // 5. DB에 추가
        const query = {}; // 조건
        // SELECT title, content, writer, hit FORM board WHERE 1 ORDER BY _id DESC;
        const rows = await collection.find(query, {filename:0, 
                filedata:0, mimetype:0, filesize:0 })
                .sort({_id : -1})
                .toArray();
        console.log(rows);

        // 6. DB닫기
        dbconn.close();

        // 7. node-sdk -> vue-sdk로 전달
        res.send({ret:1, data:rows});
    }
    catch(err) {
        console.error(err);
        res.send({ret:-1, data:err});
    }
});




// http://127.0.0.1:13000/board/insert  
// vue코드의 formData.append("img", this.img);
router.post('/insert', upload.single("img"), async function(req, res, next) {
    try{
        // 1. vue-sdk -> node-sdk로 전달 값받기
        console.log(req.body); // 제목,내용, 작성자 받음
        console.log(req.file); // 파일에 대한 정보(파일이름, 파일데이터, 파일종류, 파일용량)

        // 2. DB 에 추가할 객체 생성
        const obj = {
            title       : req.body.title, 
            content     : req.body.content,
            writer      : req.body.writer,
            hit         : 1,
            filename    : req.file.originalname,
            mimetype    : req.file.mimetype,
            filedata    : req.file.buffer,
            filesize    : req.file.size,
            regdate     : new Date()
        }

        // 3. DB연결
        const dbconn = await mongoclient.connect(mongourl, {});

        // 4. DB선택 및 컬렉션(테이블)선택
        const collection = dbconn.db("db01").collection("board");

        // 5. DB에 추가
        await collection.insertOne(obj);

        // 6. DB닫기
        dbconn.close();

        // 7. node-sdk -> vue-sdk로 전달
        res.send({ret:1, data:'db 추가 성공'});
    }
    catch(err) {
        console.error(err);
        res.send({ret:-1, data:err});
    }
});

module.exports = router;