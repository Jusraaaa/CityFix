using CityFix.Data;
using CityFix.DTOs;
using CityFix.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityFix.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
    {
        var categories = await dbContext.Categories
            .OrderBy(x => x.Name)
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Category>> GetCategory(Guid id)
    {
        var category = await dbContext.Categories.FindAsync(id);

        if (category is null)
        {
            return NotFound();
        }

        return Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<Category>> CreateCategory(CreateCategoryRequest request)
    {
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };

        await dbContext.Categories.AddAsync(category);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var category = await dbContext.Categories.FindAsync(id);

        if (category is null)
        {
            return NotFound();
        }

        dbContext.Categories.Remove(category);
        await dbContext.SaveChangesAsync();

        return NoContent();
    }
}
