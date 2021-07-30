var express = require('express');
var router = express.Router();

// $ npm install nano  --save
const nano = require('nano')('http://admin:adminpw@10.0.2.15:5984');
const db   = nano.db.use('member');

// $ npm install fabric-ca-client --save
// $ npm install fabric-common --save
// $ npm install fabric-network --save
// $ npm install fabric-protos --save
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

router.get('/retrieveHistory', async function(req, res, next) {
  try {
    // 0. 입력한 항목 받기( GET일 경우 req.query )
    const walletUser = req.query.userid;
    const car        = req.query.car;

    // 1. 환경설정 파일 읽기
    const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // 2. wallet만들기( couchdb )
    const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
    const dbName = 'wallet';
    const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

    // 3. 이미 등록된 사용자 존재 확인
    const userIdentity = await wallet.get(walletUser);
    if( !userIdentity ) {
      console.log(`${walletUser} 사용자가 없습니다.`);
      res.redirect("/");
      return;
    }

    // 4. 체인코드 호출을 위한 gateway 생성 및 접속
    const gateway = new Gateway();
    await gateway.connect(ccp, {
          wallet, 
          identity:walletUser, 
          discovery:{enabled:true, asLocalhost:true} });
    
    // 5. 채널 선택
    const network = await gateway.getNetwork('mychannel');

    // 6. 체인코드 선택
    const contract = await network.getContract('car');

    // 7. 체인코드 retrieveHistory함수 호출 (데이터를 조회)
    const result = await contract.evaluateTransaction('retrieveHistory', car); //조회
    const str = result.toString(); // buffer -> string
    const obj = JSON.parse(str);   // string -> object
    console.log(obj);
    
    // 8. gateway 닫기
    await gateway.disconnect();

    //res.redirect("/")
    res.render('readallcar', {rows : obj}); // readallcar.ejs로 전달하고 출력
  }
  catch(error) {
    console.error(error);
    res.redirect("/");
  }
});

router.post('/updateOwner', async function(req, res, next) {
  try {
    // 0. 입력한 값 받기
    const walletUser = req.body.userid; //<input type = "text" name="userid"
    const car        = req.body.car; //<input type = "text" name="car"
    const newOwner   = req.body.owner; //<input type = "text" name="owner"

    //1. 환경설정 파일 읽기
    const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 
      'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // 2. wallet만들기( couchdb )
    const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
    const dbName = 'wallet';
    const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

    // 3. 이미 등록된 사용자 존재 확인
    const userIdentity = await wallet.get(walletUser);
    if( !userIdentity ) {
      console.log(`${walletUser} 사용자가 없습니다.`);
      res.redirect("/");
      return;
    }

    // 4. 체인코드 호출을 위한 gateway 생성 및 접속
    const gateway = new Gateway();
    await gateway.connect(ccp, {
          wallet, 
          identity:walletUser, 
          discovery:{enabled:true, asLocalhost:true} });
    
    // 5. 채널 선택
    const network = await gateway.getNetwork('mychannel');

    // 6. 체인코드 선택
    const contract = await network.getContract('car');

    // 7. 체인코드 updateOwner 호출 (데이터를 변경)
    // async updateOwner(생략, key, newOwner) 
    await contract.submitTransaction('updateOwner', car, newOwner );

    // 8. gateway 닫기
    await gateway.disconnect();

    // 9. 페이지 이동
    res.redirect("/"); 
  }
  catch(error) {
    console.log(error);
    res.redirect("/")
  }
});


router.get('/readQuerySelector', async function(req, res, next) {
  try {
    // 0. 입력한 값 받기
    // req.body.userid    POST일때
    // req.query.userid   GET일때
    const userid =  req.query.userid;
    const make = req.query.make;

    //1. 환경설정 파일 읽기
    const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // 2. wallet만들기( couchdb )
    const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
    const dbName = 'wallet';
    const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

    // 3. 이미 등록된 사용자 존재 확인
    const userIdentity = await wallet.get(userid);
    if( !userIdentity ) {
      console.log(`${userid} 사용자가 없습니다.`);
      res.redirect("/");
      return;
    }

    // 4. 체인코드 호출을 위한 gateway 생성 및 접속
    const gateway = new Gateway();
    await gateway.connect(ccp, {
          wallet, 
          identity:userid, 
          discovery:{enabled:true, asLocalhost:true} });
    
    // 5. 채널 선택
    const network = await gateway.getNetwork('mychannel');

    // 6. 체인코드 선택
    const contract = await network.getContract('car');

    // 7. 체인코드 readAllCar함수 호출 (데이터를 조회)
    // async readAllCar(ctx)

    const query = {make : make};
    const result = await contract.evaluateTransaction('readQuerySelector', JSON.stringify(query)); //조회
    // await contract.submitTransaction('createCar', key, color, make, model, owner ); //변경
    const str = result.toString(); // buffer -> string
    const obj = JSON.parse(str);   // string -> object
    console.log(obj);
    
    // 8. gateway 닫기
    await gateway.disconnect();

    //res.redirect("/")
    res.render('readallcar', {rows : obj}); // readallcar.ejs로 전달하고 출력
  }
  catch(error){
    console.log(error);
    res.redirect("/");
  }
});


router.post('/deleteCar', async function(req, res, next) {
  try {
    const userid = req.body.userid;
    const car    = req.body.car;

    //1. 환경설정 파일 읽기
    const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 
      'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // 2. wallet만들기( couchdb )
    const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
    const dbName = 'wallet';
    const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

    // 3. 이미 등록된 사용자 존재 확인
    const userIdentity = await wallet.get(userid);
    if( !userIdentity ) {
      console.log(`${userid} 사용자가 없습니다.`);
      res.redirect("/");
      return;
    }

    // 4. 체인코드 호출을 위한 gateway 생성 및 접속
    const gateway = new Gateway();
    await gateway.connect(ccp, {
          wallet, 
          identity:userid, 
          discovery:{enabled:true, asLocalhost:true} });
    
    // 5. 채널 선택
    const network = await gateway.getNetwork('mychannel');

    // 6. 체인코드 선택
    const contract = await network.getContract('car');

    // 7. 체인코드 deleteCar 호출 (데이터를 변경)
    // async deleteCar(ctx, key) 
    await contract.submitTransaction('deleteCar', car );

    // 8. gateway 닫기
    await gateway.disconnect();

    // 9. 페이지 이동
    res.redirect("/");    
  }catch(error) {
      console.log(error);
      res.redirect("/");
  }
});


router.get('/readAllCar', async function(req, res, next) {
  try {
    // 0. 입력한 값 받기
    // req.body.userid    POST일때
    // req.query.userid   GET일때
    const userid =  req.query.userid;

    //1. 환경설정 파일 읽기
    const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // 2. wallet만들기( couchdb )
    const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
    const dbName = 'wallet';
    const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

    // 3. 이미 등록된 사용자 존재 확인
    const userIdentity = await wallet.get(userid);
    if( !userIdentity ) {
      console.log(`${userid} 사용자가 없습니다.`);
      res.redirect("/");
      return;
    }

    // 4. 체인코드 호출을 위한 gateway 생성 및 접속
    const gateway = new Gateway();
    await gateway.connect(ccp, {
          wallet, 
          identity:userid, 
          discovery:{enabled:true, asLocalhost:true} });
    
    // 5. 채널 선택
    const network = await gateway.getNetwork('mychannel');

    // 6. 체인코드 선택
    const contract = await network.getContract('car');

    // 7. 체인코드 readAllCar함수 호출 (데이터를 조회)
    // async readAllCar(ctx)
    const result = await contract.evaluateTransaction('readAllCar'); //조회
    // await contract.submitTransaction('createCar', key, color, make, model, owner ); //변경
    const str = result.toString(); // buffer -> string
    const obj = JSON.parse(str);   // string -> object
    console.log(obj);
    
    // 8. gateway 닫기
    await gateway.disconnect();

    //res.redirect("/")
    res.render('readallcar', {rows : obj}); // readallcar.ejs로 전달하고 출력
  }
  catch(error){
    console.log(error);
    res.redirect("/");
  }
});



router.post('/createCar', async function(req, res, next) {
  try {
    // 0. 입력한 값들 받기(인증기관에 등록된 사용자, KEY, 색상, 제조사, 모델, 소유자)
    const userid = req.body.userid;
    const key =  req.body.key; //<input type="text" name="key" />
    const color =  req.body.color;
    const make =  req.body.make;
    const model =  req.body.model;
    const owner =  req.body.owner;

    //1. 환경설정 파일 읽기
    const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 
      'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // 2. wallet만들기( couchdb )
    const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
    const dbName = 'wallet';
    const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

    // 3. 이미 등록된 사용자 존재 확인
    const userIdentity = await wallet.get(userid);
    if( !userIdentity ) {
      console.log(`${userid} 사용자가 없습니다.`);
      res.redirect("/");
      return;
    }

    // 4. 체인코드 호출을 위한 gateway 생성 및 접속
    const gateway = new Gateway();
    await gateway.connect(ccp, {
          wallet, 
          identity:userid, 
          discovery:{enabled:true, asLocalhost:true} });
    
    // 5. 채널 선택
    const network = await gateway.getNetwork('mychannel');

    // 6. 체인코드 선택
    const contract = await network.getContract('car');

    // 7. 체인코드 createCar함수 호출 (데이터를 변경)
    // async createCar(생략, key, color, make, model, owner)
    await contract.submitTransaction('createCar', key, color, make, model, owner );

    // 8. gateway 닫기
    await gateway.disconnect();

    // 9. 페이지 이동
    res.redirect("/");
  }
  catch(error){
    console.log(error);
    res.redirect("/");
  }
});




router.post('/removeUser', async function(req, res, next) {
  try {
    //0. 입력한 아이디 받기
    const userid = req.body.userid;

    //1. 환경설정 파일 읽기
    const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 
      'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    
    //2. 인증기관 접속
    const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
    const ca = new FabricCAServices(caURL);

    // 3. wallet만들기( couchdb )
    const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
    const dbName = 'wallet';
    const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
    
    // 4. 이미 등록된 사용자 존재 확인
    const userIdentity = await wallet.get(userid);
    if( !userIdentity ) {
      console.log(`${userid} 사용자가 없습니다.`);
      res.redirect("/");
      return;
    }

    // 5. 관리자 정보 가져오기
    const adminIdentity = await wallet.get('admin');
    if( !adminIdentity ) {
      console.log(`admin을 먼저 등록하세요`);
      res.redirect("/");
      return;
    }

    // 6. 관리자 정보 생성
    const provider  = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    // 7. ca에 삭제 및 wallet에 삭제
    await ca.newIdentityService().delete(userid, adminUser);
    await wallet.remove(userid);

    // 8. 페이지 이동하기
    res.redirect("/")
  }
  catch(error){
    console.log(error);
    res.redirect("/");
  }
});



router.post('/registerUser', async function(req, res, next) {
  try {
    //0. 등록하고자하는 아이디 저장
    const userid = req.body.userid; //화면에서 입력한 내용을 보관

    //1. 환경설정 파일 읽기
    const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 
      'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    //2. 인증기관 접속
    const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
    const ca = new FabricCAServices(caURL);

    // 3. wallet만들기( couchdb )
    const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
    const dbName = 'wallet';
    const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

    // 4. 이미 등록된 사용자 인지 확인
    const userIdentity = await wallet.get(userid);
    if( userIdentity ) {
      console.log(`${userid}는 이미 존재합니다.`);
      res.redirect("/");
      return;
    }

    // 5. 관리자 정보 가져오기
    const adminIdentity = await wallet.get('admin');
    if( !adminIdentity ) {
      console.log(`admin을 먼저 등록하세요`);
      res.redirect("/");
      return;
    }

    // 6. 관리자 정보 생성
    const provider  = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    // 7. 사용자 등록
    const secret = await ca.register({ 
        affiliation : 'org1.department1',
        enrollmentID : userid,
        role : 'client'
    }, adminUser);
    const enrollment = await ca.enroll({
      enrollmentID : userid,
      enrollmentSecret : secret
    });

    // 8. x.509인증서 생성
    const x509Identity = {  credentials : {
        certificate : enrollment.certificate,
        privateKey : enrollment.key.toBytes()
      },
      mspId : 'Org1MSP',
      type :'X.509' 
    };

    // 9. wallet에 보관
    await wallet.put(userid, x509Identity);

    // 10. 페이지 이동
    res.redirect("/")
  }
  catch(error){
    console.log(error);
    res.redirect("/");
  }
});


// 127.0.0.1:13000/enrollAdmin  POST
router.post('/enrollAdmin', async function(req, res, next) {
  //1. 환경설정 파일 읽기
  const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 
        'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  // console.log(ccp);

  // const ccp = { userid:'aaa', username:'bbb', userdata:{age:12} }
  // ccp.userid  === ccp['userid']
  // ccp.username  === ccp['username']
  // ccp.userdata.age  === ccp['userdata']['age']

  // 2. 인증기관(CA) 접속
  const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  const ca  = new FabricCAServices(
                caInfo.url, 
                { trustedRoots:caTLSCACerts, verify:false },
                caInfo.caName
  );

  // 3. wallet만들기( couchdb )
  const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
  const dbName = 'wallet';
  const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

  // 4. wallet에 admin이 등록된 상태인지 확인
  const identity = await wallet.get('admin');
  if(identity) {
    console.log('admin은 이미 등록되어 있습니다.');
    res.redirect("/"); //페이지를 이동하고
    return; // 종료
  }

  // 5. ca에 등록하기 
  const enrollment =  await ca.enroll({enrollmentID:'admin', enrollmentSecret:'adminpw'});

  // 6. x.509인증서 생성 : 공개키 기반의 디지털 인증서
  const x509Identity = {  credentials : {
              certificate : enrollment.certificate,
              privateKey : enrollment.key.toBytes()
      },
      mspId : 'Org1MSP',
      type :'X.509' };

  // 7. 인증서 지갑에 보관
  await wallet.put('admin', x509Identity);

  res.redirect("/");
});

//127.0.0.1:13000/  서버에 요청(request)
router.get('/', function(req, res, next) {
  //views폴더에 index.ejs파일을 화면에 표시
  res.render('index', { title: 'Express' });
});

//127.0.0.1:13000/insert
router.get('/insert', function(req, res, next) {
  // views폴더에 있는 파일을 선택해서 표시
  res.render('insert', { title: 'Express' });
});

//127.0.0.1:13000/select
router.get('/select', async function(req, res, next) {
  //DB에서 내용가져오기
  const data = await db.list( {include_docs:true} );
  console.log(data.total_rows); //개수
  console.log(data.rows);       //데이터
  console.log(__dirname)
  //select.ejs로 화면을 표시하기, (title, count, rows를 전달)
  res.render('select', { 
      title : '회원목록', 
      count : data.total_rows,
      rows  : data.rows 
  });
});

router.post('/insert', async function(req, res, next) {
  console.log(req.body);

  const obj =  {
    _id   : req.body.email, 
    name  : req.body.name, 
    age   : Number(req.body.age),
    phone : req.body.phone   
  };
  //DB에 추가하기
  await db.insert(obj);

  res.redirect('/'); //크롬에서 127.0.0.1:13000/ 엔터키
});

module.exports = router;