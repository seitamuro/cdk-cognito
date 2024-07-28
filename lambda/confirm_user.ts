import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoUser, CognitoUserPool } from "amazon-cognito-identity-js";
import { APIGatewayProxyEvent } from "aws-lambda";

type UserData = {
  username: string;
  temporaryPassword: string;
  newPassword: string;
};

const poolData = {
  UserPoolId: process.env.USER_POOL_ID || "",
  ClientId: process.env.CLIENT_ID || "",
};

const userPool = new CognitoUserPool(poolData);
const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

const getUserAttributes = async (username: string) => {
  console.log("getUserAttributes");

  const command = new AdminGetUserCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Username: username,
  });

  try {
    const response = await client.send(command);
    console.log("response:", JSON.stringify(response, undefined, 2));
    return response.UserAttributes;
  } catch (err) {
    throw new Error(`Failed to get user attributes: ${err}`);
  }
};

const changeTemporaryPassword = (userData: UserData): Promise<string> => {
  console.log("changeTemporaryPassword");
  return new Promise(async (resolve, reject) => {
    const { username, temporaryPassword, newPassword } = userData;

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    const userAttributes = await getUserAttributes(username);
    console.log("userAttributes:", userAttributes);

    cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        resolve(idToken);
      },
      onFailure: (err) => {
        console.log("onFailure in changeTemporaryPassword");
        console.log("err:", err);
        reject(err);
      },
    });
  });
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const userData: UserData = JSON.parse(event.body || "{}");

  try {
    const token = await changeTemporaryPassword(userData);
    console.log("token:", token);

    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: err }),
    };
  }
};
