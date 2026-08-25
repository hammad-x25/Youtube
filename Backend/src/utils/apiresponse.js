class apiresponse 
{
    constructor(statuscode,message="success",data)
    {
        this.statusCode=statuscode;
        this.statuscode=statuscode;
        this.message=message;
        this.data=data;
        this.success=statuscode<400;
    }
}

export {apiresponse}
