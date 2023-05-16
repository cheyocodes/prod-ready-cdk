import {
  Stack,
  StackProps,
  Stage,
} from 'aws-cdk-lib';

import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines';

import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';


// 3a. We define a Lambda Stage that deploys the Lambda Stack.
export class LambdaStage extends Stage {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new LambdaStack(this, 'LambdaStack');
  }
}

export class CdkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. We import the CodeStar Connection for Github-CDK Pipeline integration. Therefore,
    // you only need to provide the ARN of the Connection
    const codestarConnectionARN = process.env.AWS_CODESTAR_GITHUB_CONNECTION_ARN as string;

    const codePipelineSource = CodePipelineSource.connection('cheyocodes/prod-ready-cdk', 'main', {
      connectionArn: codestarConnectionARN,
    });

    // 2. We define the CDK Pipeline using the source from the first step and
    // use three commands for the synth step. We install dependencies from the yarn.lock file
    // with `npm install` command to have deterministic, fast, and repeatable builds.
    // The following two lines, we already know.
    const cdkPipeline = new CodePipeline(this, 'CdkPipeline', {
      pipelineName: 'lambda-stack-cdk-pipeline',
      synth: new ShellStep('Synth', {
        input: codePipelineSource,
        commands: [
          // 'npm install',
          'yarn install --frozen-lockfile',
          'npx projen build',
          'npx projen synth',
        ],
      }),
    });

    // 3b. Then we add this to the CDK Pipeline as a pipeline stage.
    cdkPipeline.addStage(new LambdaStage(this, 'dev'));
  }
}
