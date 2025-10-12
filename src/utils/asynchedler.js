const asyncheadler = (fn) => async(req,res,next) => {
    try {
        await fn(req,res,next); 
    } catch (error) {
        res.status(error.code|| 5000).json({
            success: false,
            message : error.message
        })
    }
}

// const asyncheadler = (reqhandl) => {
//     (req,res,next) => {
//         Promise.resolve(reqhandl(req,res,next))
//         .catch((err) => next(err))
//     }
// }
export default asyncheadler;