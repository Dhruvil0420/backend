class ApiError extends Error{
    constructor(
        statuscode,
        message = "Somthing Went Worng",
        errors = [],
        stack = ""
    ){
        super(message);
        this.message = message;
        this.statuscode = statuscode;
        this.errors = errors;
        this.data = null;
        this.success = false;

        if(stack){
            this.stack = stack;
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export {ApiError}