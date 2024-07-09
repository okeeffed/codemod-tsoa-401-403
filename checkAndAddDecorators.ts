import {
  Project,
  ClassDeclaration,
  MethodDeclaration,
  Decorator,
} from "ts-morph";

export function checkAndAddDecorators(filePaths: string[]): {
  [filePath: string]: string;
} {
  const project = new Project();
  project.addSourceFilesAtPaths(filePaths);

  const sourceFiles = project.getSourceFiles();
  const modifiedFiles: { [filePath: string]: string } = {};

  sourceFiles.forEach((sourceFile) => {
    let fileModified = false;
    const classes = sourceFile.getClasses();

    classes.forEach((classDeclaration: ClassDeclaration) => {
      const methods = classDeclaration.getMethods();

      methods.forEach((method: MethodDeclaration) => {
        const decorators = method.getDecorators();
        const hasUnauthorized = hasResponseDecorator(
          decorators,
          401,
          "Unauthorized"
        );
        const hasForbidden = hasResponseDecorator(decorators, 403, "Forbidden");

        if (!hasUnauthorized) {
          addResponseDecorator(method, 401, "Unauthorized");
          fileModified = true;
        }
        if (!hasForbidden) {
          addResponseDecorator(method, 403, "Forbidden");
          fileModified = true;
        }
      });
    });

    if (fileModified) {
      modifiedFiles[sourceFile.getFilePath()] = sourceFile.getFullText();
    }
  });

  return modifiedFiles;
}

function hasResponseDecorator(
  decorators: Decorator[],
  statusCode: number,
  description: string
): boolean {
  return decorators.some((decorator) => {
    const callExpression = decorator.getCallExpression();
    if (
      callExpression &&
      callExpression.getExpression().getText() === "Response"
    ) {
      const args = callExpression.getArguments();
      return (
        args.length >= 2 &&
        args[0].getText().includes(statusCode.toString()) &&
        args[1].getText().includes(description)
      );
    }
    return false;
  });
}

function addResponseDecorator(
  method: MethodDeclaration,
  statusCode: number,
  description: string
) {
  method.addDecorator({
    name: "Response",
    arguments: [`${statusCode}, "${description}"`],
    typeArguments: ["ErrorResponse"],
  });
  console.log(
    `Added @Response<ErrorResponse>(${statusCode}, "${description}") to method '${method.getName()}'`
  );
}

// Get file paths from command-line arguments
// TODO: Mod this to search for *.controller.ts files
const filesToCheck = process.argv.slice(2);
if (filesToCheck.length === 0) {
  console.log(
    "No files specified. Usage: ts-node checkAndAddDecorators.ts <file1> <file2> ..."
  );
} else {
  checkAndAddDecorators(filesToCheck);
}
