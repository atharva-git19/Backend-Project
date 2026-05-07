import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
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
  console.log(req.body);

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

export { registerUser };
