import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkUserIdPoolStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ユーザープールの作成
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "MyUserPool",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
    });

    // ユーザープールクライアントの作成
    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: false,
    });

    const createUserFunction = new NodejsFunction(this, "CreateUserFunction", {
      entry: "lambda/create_user.ts",
      handler: "handler",
    });
    /*const cognitoPolicy = new iam.PolicyStatement({
      actions: ["cognito-idp:AdminCreateUser"],
      resources: [userPool.userPoolArn],
    });
    createUserFunction.addToRolePolicy(cognitoPolicy);*/
    userPool.grant(createUserFunction, "cognito-idp:AdminCreateUser");
  }
}
