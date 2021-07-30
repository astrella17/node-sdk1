var express = require('express');
var router = express.Router();

// router.get()  : getting data => 조회해서 전달
// router.post()   : creating data => 내용 추가
// router.put()    : updating data => 내용 변경
// router.delete() : deleting data => 내용 삭제

const FabricCAServices = require('fabric-ca-client'); //CA 연동
const { Wallets, Gateway } = require('fabric-network'); // chaincode연동
const fs = require('fs');
const path = require('path');

// 1. 환경설정 파일 읽기
const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// 2. 인증기관(CA) 접속
const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
const caTLSCACerts = caInfo.tlsCACerts.pem;
const ca  = new FabricCAServices(
    caInfo.url, { trustedRoots:caTLSCACerts, verify:false }, caInfo.caName);

// 3. wallet만들기( couchdb )
const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
const dbName = 'wallet';

// 고객별 주문내역
// async orderOrderItems(ctx, customerID) {
// http://127.0.0.1:13000/api/orderOrderItems?cst=bbb
router.get('/orderOrderItems', async function(req, res, next) {
    try {
        // 0. 전달된 값 받기
        const customerID = req.query.cst;

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 소비자 정보 wallet에서 가져오기
        const identity = wallet.get(customerID); 
        if( !identity ) {
            res.send({ret:0, data:`${customerID} 정보가 없습니다.`});
            return;
        }
 
        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
             wallet, identity : customerID, 
             discovery:{enabled:true, asLocalhost:true} });
         
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');
 
        // 8. 체인코드 선택
        const contract = await network.getContract('order');
 
        // 9. 체인코드 호출 // async orderOrderItems(customerID)
        const buf = await contract.evaluateTransaction('orderOrderItems', customerID);
         
        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. buffer -> string -> object
        const str = buf.toString();
        const obj = JSON.parse(str);
 
        // 12. 화면으로 데이터 전송    
        res.send({ret:1, data:obj});
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 전체주문목록
// async readAllOrders(ctx, startKey, endKey) {
// http://127.0.0.1:13000/api/readAllOrders?cst=bbb
router.get('/readAllOrders', async function(req, res, nest) {
    try {
        // 0. 전달된 값 받기
        const customerID = req.query.cst;

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 소비자 정보 wallet에서 가져오기
        const identity = wallet.get(customerID); 
        if( !identity ) {
            res.send({ret:0, data:`${customerID} 정보가 없습니다.`});
            return;
        }
 
        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
             wallet, identity : customerID, 
             discovery:{enabled:true, asLocalhost:true} });
         
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');
 
        // 8. 체인코드 선택
        const contract = await network.getContract('order');
 
        // 9. 체인코드 호출 // async readAllOrders(ctx, startKey, endKey)
        const buf = await contract.evaluateTransaction('readAllOrders', '', '');
         
        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. buffer -> string -> object
        const str = buf.toString();
        const obj = JSON.parse(str);
 
        // 12. 화면으로 데이터 전송    
        res.send({ret:1, data:obj});
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 주문 1개 조회
// async readOrder(ctx, orderID) {
// http://127.0.0.1:13000/api/readOrder?oid=ORD0101&cst=bbb
router.get('/readOrder', async function(req, res, next) {
    try {
        // 0. 전달된 값 받기
        const orderID = req.query.oid;
        const customerID = req.query.cst;

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 소비자 정보 wallet에서 가져오기
        const identity = wallet.get(customerID); 
        if( !identity ) {
            res.send({ret:0, data:`${customerID} 정보가 없습니다.`});
            return;
        }
 
        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
             wallet, identity : customerID, 
             discovery:{enabled:true, asLocalhost:true} });
         
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');
 
        // 8. 체인코드 선택
        const contract = await network.getContract('order');
 
        // 9. 체인코드 호출 // async readOrder(ctx, orderID) {
        const buf = await contract.evaluateTransaction('readOrder', orderID);
         
        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. buffer -> string -> object
        const str = buf.toString();
        const obj = JSON.parse(str);
 
        // 12. 화면으로 데이터 전송    
        res.send({ret:1, data:obj});
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 주문 취소
// async deleteOrder(ctx, orderID, itemID, orderCnt, customerID) {
// http://127.0.0.1:13000/api/deleteOrder?oid=ORD0101&iid=ITEM0101&cnt=11&cst=bbb
router.get('/deleteOrder', async function(req, res, next) {
    try {
        // 0. 전달된 값 변수에 저장
        const orderID       = req.query.oid;
        const itemID        = req.query.iid;
        const orderCnt      = req.query.cnt;
        const customerID    = req.query.cst;

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 구매자 정보 wallet에서 가져오기
        const identity = wallet.get(customerID); 
        if( !identity ) { //구매자 정보가 없으면 오류
            res.send({ret:0, data:`${customerID} 정보가 없습니다.`});
            return;
        }

        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity : customerID, 
            discovery:{enabled:true, asLocalhost:true} });
        
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');

        // 8. 체인코드 선택
        const contract = await network.getContract('order');

        // 9. 체인코드 async deleteOrder(ctx, orderID, itemID, orderCnt, customerID) 
        await contract.submitTransaction('deleteOrder', orderID, itemID, orderCnt, customerID); 

        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. 화면으로 데이터 전송    
        res.send({ret:1, data:`${customerID} 주문 취소 했습니다.`});
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
})

// 주문수량변경
// async changeOrder(ctx, orderID, itemID, orderCnt) {
// http://127.0.0.1:13000/api/changeOrder?oid=ORD0101&iid=ITEM0101&cnt=11&cst=bbb
router.get('/changeOrder', async function(req, res, next) {
    try {
        // 0. 전달된 값 변수에 저장
        const orderID       = req.query.oid;
        const itemID        = req.query.iid;
        const orderCnt      = req.query.cnt;
        const customerID    = req.query.cst;

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 구매자 정보 wallet에서 가져오기
        const identity = wallet.get(customerID); 
        if( !identity ) { //구매자 정보가 없으면 오류
            res.send({ret:0, data:`${customerID} 정보가 없습니다.`});
            return;
        }

        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity : customerID, 
            discovery:{enabled:true, asLocalhost:true} });
        
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');

        // 8. 체인코드 선택
        const contract = await network.getContract('order');

        // 9. 체인코드 async changeOrder(ctx, orderID, itemID, orderCnt) {
        await contract.submitTransaction('changeOrder', orderID, itemID, orderCnt);

        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. 화면으로 데이터 전송    
        res.send({ret:1, data:`${customerID} 주문 수량 변경 했습니다.`});
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
})

// 주문하기
// http://127.0.0.1:13000/api/createOrder?oid=ORD0101&iid=ITEM0101&cnt=10&cst=bbb
// http://127.0.0.1:13000/api/createOrder?oid=ORD0102&iid=ITEM0102&cnt=20&cst=bbb
router.get('/createOrder', async function(req, res, next) {
    try {
        // 0. 전달된 값 변수에 저장
        const orderID       = req.query.oid;
        const itemID        = req.query.iid;
        const orderCnt      = req.query.cnt;
        const customerID    = req.query.cst;

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 구매자 정보 wallet에서 가져오기
        const identity = wallet.get(customerID); 
        if( !identity ) { //구매자 정보가 없으면 오류
            res.send({ret:0, data:`${customerID} 정보가 없습니다.`});
            return;
        }

        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity : customerID, 
            discovery:{enabled:true, asLocalhost:true} });
        
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');

        // 8. 체인코드 선택
        const contract = await network.getContract('order');

        // 9. 체인코드 async createOrder(ctx, orderID, itemID, orderCnt, customerID)
        await contract.submitTransaction('createOrder', orderID, itemID, orderCnt, customerID);

        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. 화면으로 데이터 전송    
        res.send({ret:1, data:`${customerID} 주문 했습니다.`});
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 물품변경이력
// async readItemHistory(ctx, id) {
// 127.0.0.1:13000/api/readItemHistory?seller=aaa&id=ITEM0101
router.get('/readItemHistory', async function(req, res, next) {
    try {
        // 0. 전달값 받기
        const seller = req.query.seller; //판매자 아이디
        const id     = req.query.id;    //물품코드

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 판매자 정보 wallet에서 가져오기
        const identity = wallet.get(seller); 
        if( !identity ) {
            res.send({ret:0, data:`${seller} 정보가 없습니다.`});
            return;
        }
 
        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
             wallet, identity : seller, 
             discovery:{enabled:true, asLocalhost:true} });
         
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');
 
        // 8. 체인코드 선택
        const contract = await network.getContract('item');
 
        // 9. 체인코드 호출 readAllItems(ctx, startKey, endKey)
        const buf = await contract.evaluateTransaction('readItemHistory', id);
         
        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. buffer -> string -> object
        const str = buf.toString();
        const obj = JSON.parse(str);
 
        // 12. 화면으로 데이터 전송    
        res.send({ret:1, data:obj});
    }
    catch(error) {
        console.error(error)
        res.send({ret:-1, data:error});
    }
});

// 물품수정
// async changeItem(ctx, id, name, content, price, quantity, seller){
// 127.0.0.1:13000/api/changeItem?id=ITEM0101&name=사과&content=사과&price=1234&quantity=10&seller=aaa    
router.get('/changeItem', async function(req, res, next) {
    try {
        // 0. 프론트엔드에서 넘어오는 값 받기
        const id        = req.query.id;
        const name      = req.query.name;
        const content   = req.query.content;
        const price     = req.query.price;
        const quantity  = req.query.quantity;
        const seller    = req.query.seller;

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 판매자 정보 wallet에서 가져오기
        const identity = wallet.get(seller); 
        if( !identity ) {
            res.send({ret:0, data:`${seller} 정보가 없습니다.`});
            return;
        }

        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity : seller, 
            discovery:{enabled:true, asLocalhost:true} });
        
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');

        // 8. 체인코드 선택
        const contract = await network.getContract('item');

        // 9. 체인코드 createItem함수 호출 (데이터를 변경)
        //async changeItem(ctx, id, name, content, price, quantity, seller){
        await contract.submitTransaction('changeItem', id, name, content, price, quantity, seller );

        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. 화면으로 데이터 전송    
        res.send({ret:1, data:`${id} 물품을 수정 했습니다.`});
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 물품삭제
// http://127.0.0.1:13000/api/deleteItem?seller=aaa&id=ITEM0101
router.get('/deleteItem', async function(req, res, next) {
    try {
        // 0. 전달값 받기
        const seller = req.query.seller; //판매자 아이디
        const id     = req.query.id;    //물품코드

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 판매자 정보 wallet에서 가져오기
        const identity = wallet.get(seller); 
        if( !identity ) {
            res.send({ret:0, data:`${seller} 정보가 없습니다.`});
            return;
        }

        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity : seller, 
            discovery:{enabled:true, asLocalhost:true} });
        
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');

        // 8. 체인코드 선택
        const contract = await network.getContract('item');

        // 9. 체인코드 createItem함수 호출 (데이터를 변경)
        // async deleteItem(생략, id)
        await contract.submitTransaction('deleteItem', id);

        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. 화면으로 데이터 전송    
        res.send({ret:1, data:`${id} 물품을 삭제 했습니다.`});
    }
    catch(error) {
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 물품전체조회
// 127.0.0.1:13000/api/readAllItems?uid=bbb 
// 체인코드 함수 : async readAllItems(ctx, startKey, endKey){
router.get('/readAllItems', async function(req, res, next) {
    try {
        const userid = req.query.uid; //bbb

        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 소비자 정보 wallet에서 가져오기
        const identity = wallet.get(userid); 
        if( !identity ) {
            res.send({ret:0, data:`${userid} 정보가 없습니다.`});
            return;
        }
 
        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
             wallet, 
             identity : userid, 
             discovery:{enabled:true, asLocalhost:true} });
         
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');
 
        // 8. 체인코드 선택
        const contract = await network.getContract('item');
 
        // 9. 체인코드 호출 readAllItems(ctx, startKey, endKey)
        const buf = await contract.evaluateTransaction('readAllItems', '','');
         
        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. buffer -> string -> object
        const str = buf.toString();
        const obj = JSON.parse(str);
 
        // 12. 화면으로 데이터 전송    
        res.send({ret:1, data:obj});
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 물품등록
// 체인코드 함수 : createItem(ctx, id, name, content, price, quantity, seller)
// 127.0.0.1:13000/api/createItem?id=ITEM0101&name=사과&content=사과&price=1234&quantity=10&seller=aaa
// 127.0.0.1:13000/api/createItem?id=ITEM0102&name=배&content=배&price=3234&quantity=110&seller=aaa
// 127.0.0.1:13000/api/createItem?id=ITEM0103&name=귤&content=귤&price=4234&quantity=120&seller=aaa
router.get('/createItem', async function(req, res, next) {
    try {
        // 0. 프론트엔드에서 넘어오는 값 받기
        const id        = req.query.id;
        const name      = req.query.name;
        const content   = req.query.content;
        const price     = req.query.price;
        const quantity  = req.query.quantity;
        const seller    = req.query.seller;
        
        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);
        
        // 5. 판매자 정보 wallet에서 가져오기
        const identity = wallet.get(seller); 
        if( !identity ) {
            res.send({ret:0, data:`${seller} 정보가 없습니다.`});
            return;
        }

        // 6. 체인코드 호출을 위한 gateway 생성 및 접속
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, 
            identity : seller, 
            discovery:{enabled:true, asLocalhost:true} });
        
        // 7. 채널 선택
        const network = await gateway.getNetwork('mychannel');

        // 8. 체인코드 선택
        const contract = await network.getContract('item');

        // 9. 체인코드 createItem함수 호출 (데이터를 변경)
        await contract.submitTransaction('createItem', id, name, content, price, quantity, seller );

        // 10. gateway 닫기
        await gateway.disconnect();

        // 11. 화면으로 데이터 전송    
        res.send({ret:1, data:`${id} 물품을 등록 했습니다.`});
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 일반 사용자 삭제? 어떤사용자를 ?/
// 크롬에서 127.0.0.1:13000/api/removeUser?uid=aaa
router.get('/removeUser', async function(req, res, next) {
    try {
        const userid = req.query.uid; //aaa가 userid변수에 들어간다.
        
        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

        // 5. wallet에 user가 등록된 상태인지 확인
        const identity = await wallet.get(userid); 
        if( !identity ) {
            res.send({ret : 0, data : `${userid} 존재하지 않습니다.`});
            return;
        }

        // 6. wallet에 admin정보 가져오기
        const adminIdentity = await wallet.get('admin');
        if( !adminIdentity ) {
            res.send({ret : 0, data : `admin이 등록되어 있지 않습니다.`});
            return;
        }

        // 7. 관리자 정보 생성
        const provider  = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // 8. CA에 삭제 wallet에 삭제
        await ca.newIdentityService().delete(userid, adminUser);
        await wallet.remove(userid);

        // 9. 프론트엔드로 전달    
        res.send( {ret:1, data:`${userid}가 삭제되었습니다.`} );
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 일반 사용자 등록? 어떤사용자를 ??
// 크롬에서 127.0.0.1:13000/api/registerUser?uid=aaa
router.get('/registerUser', async function(req, res, next) {
    try {
        const userid = req.query.uid; //aaa가 userid변수에 들어간다.
        
        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

        // 5. wallet에 user가 등록된 상태인지 확인
        const identity = await wallet.get(userid); 
        if( identity ) {
            res.send({ret : 0, data : `${userid} 이미 등록되어 있습니다.`});
            return;
        }

        // 6. wallet에 admin정보 가져오기
        const adminIdentity = await wallet.get('admin');
        if( !adminIdentity ) {
            res.send({ret : 0, data : `admin이 등록되어 있지 않습니다.`});
            return;
        }

        // 7. 관리자 정보 생성
        const provider  = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // 8. 관리자 정보를 이용하여 사용자 등록
        const secret = await ca.register({ 
            affiliation : 'org1.department1',
            enrollmentID : userid,
            role : 'client'
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID : userid,
            enrollmentSecret : secret
        });

        // 9. x.509인증서 생성
        const x509Identity = {  credentials : 
            { certificate : enrollment.certificate,
              privateKey : enrollment.key.toBytes() },
                mspId : 'Org1MSP',type :'X.509'         
            };

        // 10. wallet에 보관
        await wallet.put(userid, x509Identity);

        // 11. 프론트엔드로 전달    
        res.send( {ret:1, data:`${userid}가 등록되었습니다.`} );
    }
    catch(error){
        console.error(error);
        res.send({ret:-1, data:error});
    }
});

// 관리자 등록을 처리하는 곳
// 크롬에서 127.0.0.1:13000/api/enrollAdmin
router.get('/enrollAdmin', async function(req, res, next){
    try {
        // 4. wallet 객체 생성
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

        // 5. wallet에 admin등록된 상태인지 확인
        const identity = await wallet.get('admin'); //couchdb의 wallet에서 admin정보 가져오기
        if( identity ) {
            res.send({ret : 0, data : `admin 이미 등록되어 있습니다.`});
            return;
        }

        // 6. 인증기관(CA)에 admin등록하기
        const enrollment = await ca.enroll({enrollmentID:'admin', enrollmentSecret:'adminpw'});

        // 7. x.509인증서 변경 후에 couchdb의 wallet추가
        const x509Identity = {  credentials : {
                certificate : enrollment.certificate,
                privateKey : enrollment.key.toBytes()
            },
            mspId : 'Org1MSP',
            type :'X.509' 
        };

        // 8. wallet에 추가하기
        await wallet.put('admin', x509Identity);

        // 9. 프론트엔드로 데이터 전송
        res.send({ret : 1, data:'등록 성공했습니다.'});
    }
    catch(error){
        console.error(error); // 개발시 오류 처리를 위한 디버그 용
        res.send({ret : -1, data:error});
    }
});

module.exports = router;