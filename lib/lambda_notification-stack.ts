import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class LambdaNotificationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const errorLambda = new cdk.aws_lambda.Function(this, 'ErrorLambdaFunction', {
      description: 'This Lambda produces errors on invocation',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      handler: 'error.handler',
      code: cdk.aws_lambda.Code.fromAsset('lib/Lambdas/'),
    });

    // Define a custom Metric
    const errorMetric = new cdk.aws_cloudwatch.Metric({
      metricName: "Errors",
      namespace: "AWS/Lambda",
      period: cdk.Duration.minutes(1),
      statistic: "max",
      dimensionsMap: {
        FunctionName: errorLambda.functionName
      }
    })

    // Define a CloudWatch alarm that will monitor Lambda errors
    const errorAlarm = new cdk.aws_cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: errorMetric,
      // metric: errorLambda.metricErrors(), // the default alternative
      threshold: 0, // Trigger if there are more than 0 errors
      evaluationPeriods: 1,
      comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Alarm for Lambda errors',
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Define an SNS topic
    const errorTopic = new cdk.aws_sns.Topic(this, 'ErrorAlarmListener');
    // bind the alarm to the SNS topic defined above
    errorAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(errorTopic));

    // Define a Lambda function that will consume the SNS messages
    const notifierLambda = new cdk.aws_lambda.Function(this, 'NotifierLambdaFunction', {
      description: "This Lambda consumes SNS alarm messages",
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      handler: 'notifier.handler',
      code: cdk.aws_lambda.Code.fromAsset('lib/Lambdas/'),
      events: [new cdk.aws_lambda_event_sources.SnsEventSource(errorTopic)],
    });

    // Attach a policy to the lambda role granting permissions to read from the SNS topic
    const snsPolicy = new cdk.aws_iam.PolicyStatement({
      actions: ['sns:Subscribe', 'sns:Receive'],
      resources: [errorTopic.topicArn],
    });
    notifierLambda.addToRolePolicy(snsPolicy);
  }
}
