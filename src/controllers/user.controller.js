import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generaterefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "something went wrong when generating access and refresh token",
    );
  }
};

// steps to make user registration
//1. get user data from frontend or user body
//2. validation of use ex. cheak if empty or not or if email is valid or not
//3. check if user already exists ex. cheak if email or username is already taken
//4. cheak for images, avatar and cover image
//5. upload images to cloudinary
//6. create user object- create entry in database
//7. remove password and refresh token from response
//8. check if user is created successfully or not
//9. return result
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((field) => !field?.trim()))
    throw new apiError(400, "All fields are required");
  if (!email.includes("@"))
    throw new apiError(400, "correct email is required");

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser)
    throw new apiError(409, "User with same email or username already exist");

  const avatarFile = req.files?.avatar?.[0];
  const coverImageFile = req.files?.coverImage?.[0];

  const avatarLocalPath = avatarFile?.path;
  const coverImageLocalPath = coverImageFile?.path;

  if (!avatarLocalPath) throw new apiError(400, "Avatar file is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar?.url)
    throw new apiError(400, "Avatar upload failed. Please try again.");

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //since we are not cheaking for coverimage so if it dosent exist we will leave it empty
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser)
    throw new apiError(500, "something went wrong while registering User");

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered succesfully"));
});

// steps to make user login
//1. login via username or email
//2. find user in db
//3. passward check
//4. access and refreh token generation
//5. send secure cookies

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email) throw new apiError(400, "enter email or username");

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) throw new apiError(400, "User does not exist");

  if (!password) throw new apiError(400, "Password field is empty");
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new apiError(400, "Incorrect password");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

// steps tp logout user
//1.
export { registerUser, loginUser };
