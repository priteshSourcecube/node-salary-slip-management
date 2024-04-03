const generateEmpId = (lastEmpId) => {
    // Extract the numeric part and parse it as an integer
    const lastNum = parseInt(lastEmpId.substring(4), 10) + 1;

    // Determine the length of the numeric part
    const numLength = lastNum.toString().length;

    // Pad the number with leading zeros to maintain the desired length
    const paddedNum = '0'.repeat(7 - numLength) + lastNum;

    return `#EMP${paddedNum}`;
}

module.exports = {
    generateEmpId
}