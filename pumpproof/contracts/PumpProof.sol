// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Local replay verifier. No tokens, money, carbon credits or physical-device control.
/// @dev The auditor attests inputs; the contract independently recomputes hourly accounting.
contract PumpProof {
    address public immutable operator;
    address public immutable auditor;
    bytes32 public immutable asset;
    uint256 public immutable initialLitres;
    uint256 public immutable reserveLitres;
    uint256 public immutable capacityLitres;
    uint256 public immutable pumpMaxLitres;
    uint256 public immutable energyWhPerM3;

    struct Window { bytes32 plan; bytes32 evidence; bool settled; }
    mapping(uint256 => Window) public windows;
    error Unauthorised();
    error InvalidPolicy();
    error InvalidWindow();
    error AlreadyCommitted();
    error MissingPlan();
    error AlreadyAttested();
    error AlreadySettled();
    error EvidenceMismatch();
    error PumpLimit(uint256 hour);
    error BaselineInfeasible(uint256 hour);
    error ReserveBreach(uint256 hour);
    error TankOverflow(uint256 hour);
    error WaterDebt(uint256 finalLitres);
    error TerminalSurplus(uint256 finalLitres);
    error InvalidIntensity(uint256 hour);
    error NoCarbonBenefit();
    event PlanCommitted(uint256 indexed start, bytes32 plan);
    event EvidenceAttested(uint256 indexed start, bytes32 evidence);
    event ReceiptIssued(uint256 indexed start, bytes32 evidence, uint256 baselineGrams, uint256 operatedGrams, uint256 savingGrams);

    constructor(address op,address audit,bytes32 assetId,uint256 initial,uint256 reserve,uint256 capacity,uint256 maxPump,uint256 wh) {
        if(op==address(0)||audit==address(0)||op==audit||assetId==bytes32(0)||reserve>=initial||initial>capacity||capacity>100000000||maxPump==0||maxPump>20000000||wh==0||wh>5000)revert InvalidPolicy();
        operator=op;auditor=audit;asset=assetId;initialLitres=initial;reserveLitres=reserve;capacityLitres=capacity;pumpMaxLitres=maxPump;energyWhPerM3=wh;
    }
    function commit(uint256 start,bytes32 plan) external {
        if(msg.sender!=operator)revert Unauthorised();
        // One asset per contract and UTC-aligned, fixed 24-hour slots: overlapping
        // or renamed claims cannot reserve the same operating day twice here.
        if(start%86400!=0||plan==bytes32(0))revert InvalidWindow();
        if(windows[start].plan!=bytes32(0))revert AlreadyCommitted();
        windows[start].plan=plan;emit PlanCommitted(start,plan);
    }
    function attest(uint256 start,bytes32 evidence) external {
        if(msg.sender!=auditor)revert Unauthorised();
        if(windows[start].plan==bytes32(0))revert MissingPlan();
        if(windows[start].evidence!=bytes32(0))revert AlreadyAttested();
        if(evidence==bytes32(0))revert EvidenceMismatch();
        windows[start].evidence=evidence;emit EvidenceAttested(start,evidence);
    }
    function evidenceHash(uint256 start,uint256[24] calldata demand,uint256[24] calldata pumped,uint256[24] calldata intensity,bytes32 modelHash,bytes32 sourceHash) public view returns(bytes32) {
        return keccak256(abi.encode(block.chainid,address(this),asset,start,windows[start].plan,
            initialLitres,reserveLitres,capacityLitres,pumpMaxLitres,energyWhPerM3,
            demand,pumped,intensity,modelHash,sourceHash));
    }
    function settle(uint256 start,uint256[24] calldata demand,uint256[24] calldata pumped,uint256[24] calldata intensity,bytes32 modelHash,bytes32 sourceHash) external {
        if(msg.sender!=operator)revert Unauthorised();
        Window storage w=windows[start];
        if(w.settled)revert AlreadySettled();
        if(w.plan==bytes32(0))revert MissingPlan();
        if(w.evidence!=evidenceHash(start,demand,pumped,intensity,modelHash,sourceHash))revert EvidenceMismatch();
        uint256 level=initialLitres;uint256 baselineScore;uint256 operatedScore;
        for(uint256 h;h<24;h++){
            if(pumped[h]>pumpMaxLitres)revert PumpLimit(h);
            if(demand[h]>pumpMaxLitres)revert BaselineInfeasible(h);
            if(intensity[h]>2000)revert InvalidIntensity(h);
            if(level+pumped[h]<demand[h]+reserveLitres)revert ReserveBreach(h);
            level=level+pumped[h]-demand[h];
            if(level>capacityLitres)revert TankOverflow(h);
            baselineScore+=demand[h]*intensity[h];
            operatedScore+=pumped[h]*intensity[h];
        }
        if(level<initialLitres)revert WaterDebt(level);
        if(level>initialLitres)revert TerminalSurplus(level);
        if(operatedScore>=baselineScore)revert NoCarbonBenefit();
        w.settled=true;
        emit ReceiptIssued(start,w.evidence,baselineScore*energyWhPerM3/1000000,
            operatedScore*energyWhPerM3/1000000,(baselineScore-operatedScore)*energyWhPerM3/1000000);
    }
}
