const errorResObj = (code, message) => {
    return {
        error: {
            code,
            message,
        }
    }
}

module.exports = errorResObj;