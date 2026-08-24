

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (content === undefined) {
        throw new apierror(
            400,
            "Tweet content is required"
        );
    }

    if (typeof content !== "string") {
        throw new apierror(
            400,
            "Tweet content must be a string"
        );
    }

    if (content.trim() === "") {
        throw new apierror(
            400,
            "Tweet content cannot be empty"
        );
    }

    const tweet = await Tweets.create({
        content: content.trim(),
        owner: req.user._id
    });

    if (!tweet) {
        throw new apierror(
            500,
            "Tweet could not be created"
        );
    }

    return res
        .status(201)
        .json(
            new apiresponse(
                201,
                "Tweet created successfully",
                tweet
            )
        );
});