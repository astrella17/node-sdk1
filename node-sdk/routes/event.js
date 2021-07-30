var express = require('express');
var router = express.Router();

// npm install socket.io@3.0.1  => 웹상의 실시간 통신(채팅)
var http = require('http').createServer(function(req,res){}).listen(3004);
var io   = require('socket.io')(http, {cors : {origins:'*:*'}});


console.log('실시간으로 블록의 생성 event를 받는 곳');

// 네트워크와 체인코드를 사용하기 위한 설정
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

//환경설정 파일 읽기
const ccpPath = path.resolve (__dirname, '..', '..', 'test-network', 
    'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// wallet 정보를 가져오기 위한 couchdb 정보
const dbUrl  = 'http://admin:adminpw@10.0.2.15:5984';
const dbName = 'wallet';

// wallet에 등록되어 사용자 1명 아이디
const walletUser = 'aaa'; // 임으로 

function showTransactionData(transactionData) {
	const creator = transactionData.actions[0].header.creator;
	console.log(`    - submitted by: ${creator.mspid}-${creator.id_bytes.toString('hex')}`);
	for (const endorsement of transactionData.actions[0].payload.action.endorsements) {
		console.log(`    - endorsed by: ${endorsement.endorser.mspid}-${endorsement.endorser.id_bytes.toString('hex')}`);
	}
	const chaincode = transactionData.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec;
	console.log(`    - chaincode:${chaincode.chaincode_id.name}`);
	console.log(`    - function:${chaincode.input.args[0].toString()}`);
	for (let x = 1; x < chaincode.input.args.length; x++) {
		console.log(`    - arg:${chaincode.input.args[x].toString()}`);
	}
}

// 함수만들기 (서버구동시 자동으로 실행되지는 않음)
async function main() {
    try{
        console.log('main 함수 구동 중');

        // wallet db에 접속하기
        const wallet = await Wallets.newCouchDBWallet(dbUrl, dbName);

        // walletUser변수에 정의된 사용자가 존재하는지 확인
        const identity = await wallet.get(walletUser);
        if( !identity ) {
            console.error(`${walletUser} 사용자가 존재하지 않습니다.`);
            return; //함수 종료
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

        // 7. 리스너 함수 생성
        let listener = async (event) => {
            // 자동으로 호출됨
            // 체인코드에서 이벤트 발생( createCar, deleteCar, updateOwner )
            console.log(event.chaincodeId);
            console.log(event.eventName);
            const str = event.payload.toString();
            const obj = JSON.parse(str);
            console.log(obj);

            // 클라이언트로 전달하기 (전달하는 값은 이벤트 종류와 데이터)
            io.sockets.emit('subscribe', {event:event.eventName, data : obj});
            // socket.io 파이어베이스, mqtt
            
            //트랜잭션 이벤트 정보
            const eventTransaction = event.getTransactionEvent();
            console.log(eventTransaction);
            console.log(eventTransaction.transactionData.actions[0]);

            //블록 정보 
            const eventBlock = eventTransaction.getBlockEvent();
            console.log(eventBlock);
            
            console.log(showTransactionData( eventTransaction.transactionData ))
        }

        // 8. 리스너 함수 등록
        await contract.addContractListener(listener);
    }
    catch(error) {
        console.error(error);
        return;
    }
}
main(); //함수호출하기


module.exports = router;
