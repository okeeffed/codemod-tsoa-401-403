// __tests__/test.controller.ts
import { Response, ErrorResponse } from "tsoa";

class TestController {
  @SomeDecorator()
  public testMethod() {
    // Method implementation
  }
}
