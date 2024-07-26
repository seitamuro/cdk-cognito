import {
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayProxyEvent } from "aws-lambda";

const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<any> => {
  //console.log("event:", JSON.stringify(event, undefined, 2));
  console.log("body: ", event.body);
  console.log("parse: ", JSON.parse(event.body || "{}"));

  const { userPoolId, username, email } = JSON.parse(event.body || "{}");
  console.log("parse is successful");

  const command = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: email,
    UserAttributes: [
      //{ Name: "name", Value: username },
      { Name: "email", Value: email },
      { Name: "email_verified", Value: "true" },
      //{ Name: "SecretHash", Value: "secretHash" },
      //{ Name: "ConfirmationCode", Value: "confirmationCode" },
    ],
    TemporaryPassword: "Password1234567890!",
    DesiredDeliveryMediums: ["EMAIL"],
  });

  try {
    const response = await client.send(command);
    console.log("response:", JSON.stringify(response, undefined, 2));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `User ${username} created` }),
    };
  } catch (err) {
    console.error("error:", JSON.stringify(err, undefined, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Error creating user ${username}` }),
    };
  }
};
