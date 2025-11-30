import React, {useState, useEffect} from 'react';
import {ethers} from 'ethers';

const Healthcare = () => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);
    const [isOwner, setIsOwner] = useState(null);
 
    const [patientName, setPatientName] = useState(''); 
    const [patientID, setPatientID] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [treatment, setTreatment] = useState('');
    const [patientRecords, setPatientRecords] = useState([]);

    // ตัวแปรสำหรับ Debug
    const [networkName, setNetworkName] = useState("Loading...");
    const [ownerFromContract, setOwnerFromContract] = useState("Wait...");
    const [providerAddress, setProviderAddress] = useState("");

    // Address ของสัญญา (ใช้ตัวเดิมของคุณ)
    const contractAddress = "0x3E4EA7869F43b9E43a821FfbcDFA3aE454019f7b";

    const contractABI = [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "patientID",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "patientName",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "diagnosis",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "treatment",
                    "type": "string"
                }
            ],
            "name": "addRecord",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "provider",
                    "type": "address"
                }
            ],
            "name": "authorizeProvider",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getOwner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "patientID",
                    "type": "uint256"
                }
            ],
            "name": "getPatientRecords",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "recordID",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string",
                            "name": "patientName",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "diagnosis",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "treatment",
                            "type": "string"
                        },
                        {
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct HealthcareRecords.Record[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    const switchToPolygon = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }],
            });
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("กรุณาสลับ Network ใน MetaMask เป็น Polygon Mainnet ด้วยตัวเอง");
        }
    }

    useEffect(() => {
        const connectWallet = async () => {
            try {
                if (!window.ethereum) {
                    alert("Please install MetaMask!");
                    return;
                }
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send('eth_requestAccounts', []);
                
                const signer = provider.getSigner();
                const network = await provider.getNetwork();
                
                setProvider(provider);
                setSigner(signer);
                setNetworkName(`${network.name} (Chain ID: ${network.chainId})`);

                const accountAddress = await signer.getAddress();
                setAccount(accountAddress);

                const contract = new ethers.Contract(contractAddress, contractABI, signer);
                setContract(contract);

                try {
                    const ownerAddress = await contract.getOwner();
                    setOwnerFromContract(ownerAddress);
                    const isOwnerNow = accountAddress.toLowerCase() === ownerAddress.toLowerCase();
                    setIsOwner(isOwnerNow);
                } catch (err) {
                    console.error("Error fetching owner:", err);
                    setOwnerFromContract("ERROR");
                    setIsOwner(false);
                }
            } catch (error) {
                console.error("Error connecting to wallet: ", error);
            }
        };
        connectWallet();

        if (window.ethereum) {
            window.ethereum.on('chainChanged', () => window.location.reload());
            window.ethereum.on('accountsChanged', () => window.location.reload());
        }
    }, []);

    const fetchPatientRecords = async () => {
        if(!contract) return;
        try {
            const records = await contract.getPatientRecords(patientID);
            console.log(records);
            setPatientRecords(records);
        } catch(error) {
            console.error("Error fetching patient records", error);
            alert("Error fetching records.");
        }
    }

    const addRecord = async () => {
        if(!contract) return;
        try {
            const tx = await contract.addRecord(patientID, patientName, diagnosis, treatment);
            await tx.wait();
            
            alert(`Record added successfully!`);
            fetchPatientRecords();

        } catch(error) {
            console.error("Error adding records", error);
            alert("Error adding record: " + (error.data?.message || error.message));
        }
    }

    const authorizeProvider = async () => {
        if(!contract) return;
        if (isOwner){
            try {
                const tx = await contract.authorizeProvider(providerAddress);
                await tx.wait();
                alert(`Provider ${providerAddress} authorized successfully`);
            } catch(error) {
                console.error("Error authorizing provider", error);
                alert("Transaction failed");
            }
        } else {
            alert("Only contract owner can call this function.");
        }
    }

    const isPolygon = networkName.includes("137") || networkName.includes("matic");

    return(
        <div className='container'>
            <h1 className = "title">HealthCare Application</h1>
            
            <div style={{
                backgroundColor: isPolygon ? '#e8f5e9' : '#ffebee', 
                padding: '15px', 
                border: isPolygon ? '2px solid green' : '2px solid red', 
                borderRadius: '10px', 
                marginBottom: '20px'
            }}>
                <h3>{isPolygon ? "✅ System Ready" : "⚠️ Network Warning"}</h3>
                <p><strong>Connected Network:</strong> {networkName}</p>
                <p><strong>My Wallet:</strong> {account}</p>
                <p><strong>Contract Owner:</strong> {ownerFromContract}</p>
                <p><strong>Status:</strong> {isOwner ? "✅ You are the Owner" : "❌ Not Owner / Not Connected"}</p>
                
                {!isPolygon && (
                    <div style={{marginTop: '10px'}}>
                        <button 
                            style={{backgroundColor: '#2196F3', color: 'white', padding: '10px 20px', border: 'none', borderRadius:'5px', cursor: 'pointer'}} 
                            onClick={switchToPolygon}
                        >
                            🔄 Switch to Polygon
                        </button>
                    </div>
                )}
            </div>

            {account && <p className='account-info'>Connected Account: {account}</p>}
            {isOwner && <p className='owner-info'>You are the contract owner</p>}

        <div className='form-section'>
            <h2>Fetch Patient Records</h2>
            <input className='input-field' type='text' placeholder='Enter Patient ID' value={patientID} onChange={(e) => setPatientID(e.target.value)}/>
            <button className='action-button' onClick={fetchPatientRecords}>Fetch Records</button>
        </div>

        <div className="form-section">
            <h2>Add Patient Record</h2>
            {/* 3. เพิ่มช่องกรอกชื่อ Patient Name ตรงนี้ */}
            <input className='input-field' type='text' placeholder='Patient Name' value={patientName} onChange={(e) => setPatientName(e.target.value)}/>
            
            <input className='input-field' type='text' placeholder='Diagnosis' value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}/>
            <input className='input-field' type='text' placeholder='Treatment' value={treatment} onChange={(e) => setTreatment(e.target.value)}/>
            <button className='action-button' onClick={addRecord}>Add Records</button>

        </div>
        <div className="form-section">
            <h2>Authorize HealthCare Provider</h2>
            <input className='input-field' type= "text" placeholder='Provider Address' value = {providerAddress} onChange={(e) => setProviderAddress(e.target.value)}/>
            <button className='action-button' onClick={authorizeProvider}>Authorize Provider</button>
        </div>

        <div className='records-section'>
            <h2>Patient Records</h2>
            {patientRecords.map((record, index) => (
                <div key = {index} className="record-card">
                    <p><strong>Record ID:</strong> {record.recordID.toNumber()}</p>
                    <p><strong>Name:</strong> {record.patientName}</p> {/* แสดงชื่อคนไข้ด้วย */}
                    <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
                    <p><strong>Treatment:</strong> {record.treatment}</p>
                    <p><strong>Timestamp:</strong> {new Date(record.timestamp.toNumber() * 1000).toLocaleString()}</p>
            </div>
            ))}
        </div>

        </div>
    )
}

export default Healthcare;