import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { APIGatewayProxyEvent } from "aws-lambda";

const userPool = new CognitoUserPool({
  UserPoolId: process.env.USER_POOL_ID || "",
  ClientId: process.env.USER_POOL_CLIENT_ID || "",
});

type UserData = {
  username: string;
  password: string;
};

const authenticateUser = async (userData: UserData): Promise<any> => {
  return new Promise((resolve, reject) => {
    const { username, password } = userData;

    const authenticationData = {
      Username: username,
      Password: password,
    };

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    const authenticationDetails = new AuthenticationDetails(authenticationData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        console.log(idToken);
        resolve(idToken);
      },
      onFailure: (err) => {
        console.log("error in authenticateUser", err);
        reject(err);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        reject("New password required");
      },
    });
  });
};

export const handler = async (event: APIGatewayProxyEvent) => {
  const userData: UserData = JSON.parse(event.body || "{}");

  try {
    const token = await authenticateUser(userData);

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
