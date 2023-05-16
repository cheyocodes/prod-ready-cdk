exports.handler = function(event, context) {
  console.log('Hello, CloudWatch!'); 
  context.succeed('Hello, World!');
}

